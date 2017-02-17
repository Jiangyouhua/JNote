/**
 * Created by Jiangyouhua on 2016/10/31.
 * 1. 通过key,value传送信息
 */

var Jiangyouhua = [] // 各tab的tool的当前状态
var CurrentTab = null //当前tabid


/**
 * 添加按钮点击事伯
 */
chrome.browserAction.onClicked.addListener(function(tab) {

    // 记录各tab信息
    CurrentTab = tab
    Jiangyouhua[tab.id] = !Jiangyouhua[tab.id];

    // 发送信息至JNote.js
    chrome.tabs.sendRequest(tab.id, { key: "ToolShow" }, function(re) {});

    chrome.tabs.sendRequest(tab.id, { key: "CurrentTab", value: tab }, function(re) {});

    chrome.tabs.sendRequest(tab.id, { key: "ConfigServer", value: localStorage.getItem("server") }, function(re) {});
    // 显示笔记工具栏，并截图， 发送到画布
    // chrome.tabs.captureVisibleTab(window.Defaults, {format: "png", quality: 100}, function (url) {})
});

/**
 * 接收从JNote.js 传入的信息
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (!request) {
        return
    }
    switch (request.key) {
        case "ScreenShot":
            // 即时截屏
            var tab = request.value
            chrome.tabs.captureVisibleTab(window.Defaults, { format: "png", quality: 100 }, function(url) {
                //发送信息到前台
                chrome.tabs.sendRequest(tab, { key: "ScreenShot", value: url, save: request.save }, function(re) {});
            })
            break;
    }
});