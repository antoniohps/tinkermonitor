/**
 * Copyright 2019 Antonio Selvatici
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the Software
 * is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

document.addEventListener('DOMContentLoaded', function () {

    console.log("TinkerMon background: loading script");

    var button = document.querySelector("#toggle-mon-btn");
    var lastMsg = document.querySelector("#last-msg");
    var udpPort = document.querySelector('#udp-port');

    // Envia uma mensagem para a página do TinkerCad
    function sendMessage(msg, port) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { command: msg, port: port}, function (response) {
                var state = false;
                if (response && 'state' in response) {
                    state = response.state; 
                }
                setMonitorState(button, state);
            });
        });
    }

    // Altera a GUI de acordo com o estado de captura
    function setMonitorState(button, state) {
        if (state) {
            button.innerText = "Monitorando";
            udpPort.readonly = true;
        } else {
            button.innerText = "Nao monitorando";
            udpPort.readonly = false;
        }
    }

    // Gerencia mensagens chegando da página de monitoramento
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
    sendMessage("query", 0);
    button.addEventListener('click', function () {
        //TODO: validate port input
        sendMessage("toggle", parseInt(udpPort.value));
    });
});
