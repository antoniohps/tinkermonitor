document.addEventListener('DOMContentLoaded', function () {

    console.log("TinkerMon background: loading script");

    let button = document.querySelector("#toggle-mon-btn");
    let lastMsg = document.querySelector("#last-msg");

    //Envia uma mensagem para a página do TinkerCad
    function sendMessage(msg, responseHandler) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { command: msg }, responseHandler);
        });
    }

    //Altera a GUI de acordo com o estado de captura
    function setMonitorState(button, state) {
        if (state) {
            button.innerText = "Monitorando";
        } else {
            button.innerText = "Nao monitorando";
        }
    }

    //Gerencia mensagens chegando da página de monitoramento
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
            if (sender.tab && request.origin == 'tinkermonitor' && 'payload' in request) {
                lastMsg.innerText = request.payload;
                setMonitorState(button, true);
            }
            sendResponse(true);
        });

    setMonitorState(button, false);
    button.addEventListener('click', function () {
        sendMessage("toggle", function (response) {
            var state;
            if (response && 'state' in response) {
                state = response.state;
            } else state = false;
            setMonitorState(button, state);
        });
    });

});
