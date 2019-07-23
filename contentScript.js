var __TCmonitorState = false;
var __TCprevLen = 0;

console.info("TinkerMon: loading contentScript.js");

//Create a new MutationObserver object
const __TCobserver = new MutationObserver(
    function (mutations) {
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
        // this is the callback function
        //console.log(mutations);
    });

//Envia mensagens para o popup script
function sendMessage(msg) {
    chrome.runtime.sendMessage({ origin: 'tinkermonitor', payload: msg }, function (response) { });
}

function startMonitor() {

    const selector = "body > div.root_container.js-editor.js-editor--circuit.editorContainer > div.editor.js-root_container > div.editor__content.js-editor__content > div.js-tpl-target__code_panel > div > div.code_panel__serial.js-code_panel__serial > div.code_panel__serial__content.js-code_panel__serial__content > div.code_panel__serial__top > div.code_panel__serial__content__text.js-code_panel__serial__text.js-code_editor__serial-monitor__content";
    const textPanel = document.querySelector(selector);
    if (textPanel) {
        __TCobserver.observe(textPanel, { attributes: true, childList: true, attributeOldValue: true });
        __TCmonitorState = true;
    } else __TCmonitorState = false;

    console.log("TinkerMon: monitor state is: " + __TCmonitorState);
}

function stopMonitor() {
    __TCobserver.disconnect();
    __TCmonitorState = false;
}

//Gerencia as mensagens recebidas
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (!sender.tab && 'command' in request) {
            switch (request.command) {
                case 'start': startMonitor(); break;
                case 'stop': stopMonitor(); break;
                case 'toggle': __TCmonitorState ? stopMonitor() : startMonitor(); break;
                default:
            }
        }
        sendResponse({ state: __TCmonitorState });
    });

console.info("TinkerMon: contentScript.js loaded");

