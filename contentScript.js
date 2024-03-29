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

let __TCPostPort = 0; 
let __TCmonitorState = false;
let __TCprevLen = 0;

//Create a new MutationObserver object
const __TCobserver = new MutationObserver(
    function (mutations) {
        
        //Cria a string `changes` de forma cumulativa
        //a partir das lista de mudanças
        let prevLen = __TCprevLen;
        let changes = '';
        mutations.forEach(function(mutation) {
            const deltaLen = mutation.target.innerText.length - prevLen;
            if(deltaLen > 0) {
                changes += mutations[0].target.innerText.substring(prevLen);
            }
            prevLen = mutation.target.innerText.length; 
        });
        __TCprevLen = prevLen;
        if(changes.length > 0) sendMessage(changes);
    });

// Envia mensagens para o popup script e para
// o servidor
function sendMessage(msg) {

    if (__TCPostPort > 0) {

        let ajax = new XMLHttpRequest();
        // Seta tipo de requisição: Post e a URL da API
        ajax.open("POST", "http://localhost:"+__TCPostPort+"/tinkermon", true);
        ajax.setRequestHeader("Content-type", "text/plain");
        // Seta paramêtros da requisição e envia a requisição
        ajax.send(msg);

        chrome.runtime.sendMessage({
            origin: 'tinkermonitor',
            payload: msg
        }, function (response) { });
    }
}

// Consulta novas mensagens a swere enviadas ao Arduino
function queryInput(port, inputPanel) {
    let ajax = new XMLHttpRequest();
    // Seta tipo de requisição e URL com os parâmetros
    ajax.open("GET", "http://localhost:"+port+"/tinkermon", true);
    // Envia a requisição
    ajax.send();
    // Cria um evento para receber o retorno.
    ajax.onreadystatechange = function () {
        // Caso o state seja 4 e o http.status for 200, é porque a requisiçõe deu certo.
        if (ajax.readyState == 4 && [200, 304].indexOf(ajax.status) >= 0 ) {
            inputPanel.value = ajax.responseText.trim();
            //Cria e dispara o evento de keyboard (enter)
            let event = new KeyboardEvent('keypress', {keyCode: 13, which: 13, key: 13 });
            inputPanel.dispatchEvent(event);

            // Agenda uma nova chamada
            if (__TCmonitorState)
                setTimeout(function () { queryInput(port, inputPanel); }, 2000);
        }
    }

}

// Inicia o monitoramento do Serial Monitor
// do TinkerCad e envio das novas mensagens
// ao poppu script e à porta UDP
function startMonitor(port) {

    __TCmonitorState = false;

    const selectorText = "body > div.root_container.js-editor.js-editor--circuit.editorContainer > div.editor.js-root_container > div.editor__content.js-editor__content > div.js-tpl-target__code_panel > div > div.code_panel__serial.js-code_panel__serial > div.code_panel__serial__content.js-code_panel__serial__content > div.code_panel__serial__top > div.code_panel__serial__content__text.js-code_panel__serial__text.js-code_editor__serial-monitor__content";
    const selectorInput = "body > div.root_container.js-editor.js-editor--circuit.editorContainer > div.editor.js-root_container > div.editor__content.js-editor__content > div.js-tpl-target__code_panel > div > div.code_panel__serial.js-code_panel__serial > div.code_panel__serial__content.js-code_panel__serial__content > div.code_panel__serial__bottom.js-code_panel__serial__bottom.js-code_editor__serial-monitor__bottom.clearfix > input";
    const textPanel = document.querySelector(selectorText);
    const inputPanel= document.querySelector(selectorInput);
    if (textPanel && inputPanel) {
        __TCPostPort = Math.abs(parseInt('' + port)); //Enforce port is positive integer
        __TCobserver.observe(textPanel, { attributes: true, childList: true, attributeOldValue: true });
        queryInput(__TCPostPort, inputPanel);
        __TCmonitorState = true;
    }
}

// Para o monitoramento
function stopMonitor() {
    __TCobserver.disconnect();
    __TCmonitorState = false;
}

// Gerencia as mensagens recebidas
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (!sender.tab && 'command' in request) {
            switch (request.command) {
                case 'start': startMonitor(request.port); break;
                case 'stop': stopMonitor(); break;
                case 'toggle': __TCmonitorState ? stopMonitor() : startMonitor(request.port); break;
                default:
            }
        }
        sendResponse({ state: __TCmonitorState });
    });


