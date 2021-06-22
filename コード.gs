// 次の平日にトリガーセット
function setWeekdayTrigger(h, m) {
  const setTime = new Date();
  setTime.setDate(setTime.getDate() + 1)
  while(setTime.getDay() < 1 || setTime.getDay() > 5) {
    setTime.setDate(setTime.getDate() + 1)
  }
  setTime.setHours(h);
  setTime.setMinutes(m); 
  ScriptApp.newTrigger('myFunction').timeBased().at(setTime).create();  
}

function callWebApi(token, apiMethod, payload) {
  const response = UrlFetchApp.fetch(
    `https://www.slack.com/api/${apiMethod}`,
    {
      method: "post",
      contentType: "application/x-www-form-urlencoded",
      headers: { "Authorization": `Bearer ${token}` },
      payload: payload,
    }
  );
  // console.log(`Web API (${apiMethod}) response: ${response}`)
  return JSON.parse(response);
}

function getEndWorkTimeUnixtime(day) {
  return Date.parse(Utilities.formatDate(day, 'JST', 'yyyy/MM/dd 18:30')) / 1000;
}

function sortTopReactionPost(posts) {
  var postsWithSum = posts.map(function(post) {
    post.reaction_sum = post.reactions.reduce((p, c) => p + c.count, 0);
    return post;
  })

  return postsWithSum.sort((a, b) => b.reaction_sum - a.reaction_sum);
}

function emojiCount(post) {
  return post.reactions.map(r => {
    return ":" + r.name + ":×" + r.count
  }).join(", ");
}

function postMessage(now, slack_token, conversations_history_limit, top_num, url_template,
  slack_bot_token, send_channel) {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const oldest = getEndWorkTimeUnixtime(yesterday);
  const latest = getEndWorkTimeUnixtime(now);

  const conversationsList = callWebApi(slack_token, "conversations.list", {
    exclude_archived: true,
    types: 'public_channel',
    limit: conversations_history_limit,
  });

  if (conversationsList.ok != true) {
    console.log("conversations.list error");
    return false;
  }

  var posts = [];
  conversationsList.channels.forEach(function(channel) {
    const conversationsHistory = callWebApi(slack_token, "conversations.history", {
      channel: channel.id,
      oldest: oldest.toFixed(),
      latest: latest.toFixed(),
    });

    conversationsHistory.messages.forEach(function(message) {
      if ("reactions" in message) {
        var _msg = message;
        _msg.channel = channel.id;
        posts = posts.concat(_msg);
      }
    });

  });

  const sortedTRP = sortTopReactionPost(posts);

  var msg = "今日のリアクショントップ" + top_num + "\n";
  msg += sortedTRP.slice(0, top_num).map(p => 
    url_template
      .replace("%CHANNEL%", p.channel)
      .replace("%TS%", p.ts.replace(".", ""))
      + "\n" + emojiCount(p)
  ).join("\n");

  console.log(msg);

  callWebApi(slack_bot_token, "chat.postMessage", {
    channel: send_channel,
    text: msg
  });
}

function myFunction() {
  setWeekdayTrigger(18, 25);

  const slack_token = PropertiesService.getScriptProperties().getProperty("SLACK_TOKEN");
  const slack_bot_token = PropertiesService.getScriptProperties().getProperty("SLACK_BOT_TOKEN");
  const send_channel = PropertiesService.getScriptProperties().getProperty("SEND_CHANNEL");
  const top_num = PropertiesService.getScriptProperties().getProperty("TOP_NUM");
  const conversations_history_limit = PropertiesService.getScriptProperties().getProperty("CONVERSATIONS_HISTORY_LIMIT");
  const url_template = "https://meisterguild.slack.com/archives/%CHANNEL%/p%TS%";

  postMessage(new Date(), slack_token, conversations_history_limit, top_num, url_template, slack_bot_token, send_channel);
}
