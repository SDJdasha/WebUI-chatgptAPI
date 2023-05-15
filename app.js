$(document).ready(function () {
  const apiKey = "这里替换成key";
  let messages = [];

  function addMessageToChat(message, sender) {
    let formattedMessage = message;
    let listItem = $("<li>").css("white-space", "pre-wrap").text(`${sender}: `);
    // 检测是否是代码块
    if (message.includes("```")) {    
    let codeBlocks = message.split("```");
    formattedMessage = "";
    for (let i = 0; i < codeBlocks.length; i++) {
      if (i % 2 === 0) {
        // 不是代码块
        listItem.append($('<span>').text(codeBlocks[i]));
      } else {        
        listItem.append(
          $('<div>').addClass('code-container')
          .append($('<pre>').append($('<code>').text(codeBlocks[i])))
          .append($('<div>').addClass('copy-button').text('复制'))
          );
      }
    }

    } else {
      listItem.append($('<span>').text(message));
    }
    listItem.append($('<hr />'));
  
    if (sender === "Status") {
    listItem.css("color", "lightblue");
    }

    $("#chat-list").prepend(listItem);
    
    $('.copy-button').click(function(){
      //console.log("clickkkkk");
      var codeContainer = $(this).closest('.code-container');
      var code = codeContainer.find('code').text();
      var tempInput = $('<textarea>').val(code).appendTo('body').select();
      document.execCommand('copy');
      tempInput.remove();
    });
  }  

  function sendMessageToOpenAI(message, modelName) {
    let continuous = $("#continuous").is(":checked");
    let recentMessages = $("#continuous").is(":checked") ? messages.slice(-6) : [];//-6代表最近6条消息
    let requestBody = {
      model: modelName,//gpt-3.5-turbo，gpt-4
      messages: recentMessages.concat([{ role: "user", content: message }]),
    };
    if (continuous) {
      requestBody.max_tokens = 500;//连续对话时允许的回复最大token数（可理解为字数），可以修改该数字
    }
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify(requestBody),
    };

    console.log("Request Body:", requestOptions.body);
    addMessageToChat("正在等待回复……", "Status");

    return fetch("https://api.openai.com/v1/chat/completions", requestOptions)
      .then((response) => response.json())
      .then((data) => data.choices && data.choices[0] && data.choices[0].message.content);
  }

  let prevContinuous = false;
  $("#chat-form").submit(function (event) {
    event.preventDefault();
    let message = $("#message").val();
    let modelName = $("#model").val();
    let continuous = $("#continuous").is(":checked");
    if (prevContinuous !== continuous) {
      messages = [];
    }
  prevContinuous = continuous;
    addMessageToChat(message, "User");
    sendMessageToOpenAI(message, modelName)
      .then((response) => {
        if (response) {
          $("#chat-list li:first").remove();
          addMessageToChat(response, "AI");
          messages.push({ role: "user", content: message }, { role: "assistant", content: response });
          console.log("Response:",response);
        } else {
          $("#chat-list li:first").remove();
          addMessageToChat("Error: Unable to get a response from OpenAI.", "Error");
        }
      })
      .catch((error) => {
        $("#chat-list li:first").remove();
        addMessageToChat("Error: " + error, "Error");
      });
    $("#message").val("");
  });
});