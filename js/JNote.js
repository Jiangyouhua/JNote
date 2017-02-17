/**
 * Created by jiangyouhua on 2016/11/1.
 */

/***
 * 建立 笔记对象
 * 实现写，擦，切，保存，分享
 * @constructor
 */
var JColor = "#F00"
var JNote = {
    w: 0,
    h: 0,
    Ratio: 1,
    Stroke: 1,
    // 浏览器显示区的宽高
    Img: null,
    tab: null,
    Server: "http：//localhost:1234/touch/whu/",

    // JNote的html，显示工具栏与画布，画布不支持style:width, height
    Html: function(w, h) {
        return '<div id="jiangyouhua-note">' +
            '<canvas id="jiangyouhua-canvas" style="position: absolute; mix-blend-mode: multiply; z-index:2147483643; left: 0; top: 0;" width=' + w + 'px"; height="' + h + 'px">您的浏览器不支持 canvas 标签 </canvas>' +
            '<div id="jiangyouhua-cut-level" style="display:none; position: absolute; cursor: crosshair; text-align: center; z-index:2147483645; left: 0; top: 0; width:' + w + 'px; height:' + h + 'px"></div>' +
            '<div id="jiangyouhua-cut-canvas" style="display:none; position: absolute; cursor: crosshair; z-index:2147483646; border: dashed ' + JNote.Stroke + 'px red;background-repeat: no-repeat"></div>' +
            '<div style="position: fixed; left:0; bottom:0; z-index:2147483647; background: #222; width: 100%;text-align: center; padding: 5px 0;" id="jiangyouhua-tool">' +
            '<button type="button" data-value=0 style="background: #F00;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #0F0;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #00F;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #FF0;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #0FF;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #F0F;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #CCC;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #888;" class="jiangyouhua-color">&nbsp;</button>' +
            '<button type="button" data-value=0 style="background: #444;" class="jiangyouhua-color">&nbsp;</button>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<button type="button" data-value=1 class="jiangyouhua-size" >__</button>' +
            '<button type="button" data-value=5 class="jiangyouhua-size active">▂</button>' +
            '<button type="button" data-value=10 class="jiangyouhua-size">▅</button>' +
            '<button type="button" data-value=20 class="jiangyouhua-size">█</button>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<button type="button" data-value="pen" class="active">Pen</button>' +
            '<button type="button" data-value="erase">Erase</button>' +
            '<button type="button" data-value="text">Text</button>' +
            '<button type="button" data-value="cut">Cut</button>' +
            '<button type="button" data-value="reset">Clear</button>' +
            '&nbsp;&nbsp;&nbsp;' +
            '<button type="button" data-value="close">Close</button>' +
            '<button type="button" data-value="save">Save</button>' +
            '</div>' +
            '</div>'
    },

    // 绘图设定的数据，c:颜色，s:笔宽，t:工具（0画笔，1橡皮，2文字，3截切）
    // 1. c为空，表示为橡皮擦
    // 2. s为空，表示为裁切
    data: {
        c: JColor,
        s: 1,
        t: 0,
        x: 0,
        y: 0,
    },

    // 裁切区数据
    cutArea: {
        x: 0,
        y: 0,
        w: 0,
        h: 0
    },

    // scroll的位置
    scroll: {
        top: 0,
        left: 0
    },

    // 截屏的图片
    images: null,

    // 设置颜色值
    color: function(it, color) {
        JNote.data.c = color
        if (JNote.data.t != 2) {
            JNote.data.t = 0
        }
    },

    // 设置线宽
    size: function(it, s) {
        JNote.data.s = s
        JNote.cutHide()
        if (JNote.data.t > 1) {
            JNote.data.t = 0
        }
    },
    // 笔
    pen: function(it) {
        JNote.data.t = 0
        JNote.cutHide()
    },

    // 橡皮擦
    erase: function(it) {
        JNote.data.t = 1
        JNote.cutHide()
    },

    // 文字
    text: function(it) {
        JNote.data.t = 2
        JNote.cutHide()
    },

    // 载切
    cut: function(it) {
        JNote.data.t = 3
    },

    // 关闭JNote应用
    close: function(it) {
        $("#jiangyouhua-note").hide();
        chrome.extension.sendRequest({ key: 1, value: false }, function() {});
    },

    // 保存JNote内容
    save: function(it) {
        JNote.screenShot(true)
    },

    // 下载图片
    load: function(src) {
        // 没有截切
        if (!JNote.cutArea.w) {
            JNote.downloadFile(src)
            return
        }

        // 截切
        var c = document.createElement("canvas")
        c.setAttribute("width", JNote.cutArea.w * JNote.Ratio)
        c.setAttribute("height", JNote.cutArea.h * JNote.Ratio)

        var ctx = c.getContext("2d")
        var img = new Image()
        img.src = src
        console.log(img)
        ctx.drawImage(img, JNote.cutArea.x * JNote.Ratio, JNote.cutArea.y * JNote.Ratio, JNote.cutArea.w * JNote.Ratio, JNote.cutArea.h * JNote.Ratio, 0, 0, JNote.cutArea.w * JNote.Ratio, JNote.cutArea.h * JNote.Ratio)
        src = c.toDataURL()
        JNote.downloadFile(src)
    },

    downloadFile: function(src) {
        var name = "JNote: " + document.title + ".png"
        var a = document.createElement('a');
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.download = name;
        a.href = src.replace("image/png", "image/octet-stream");
        a.dispatchEvent(event);
    },

    // 分享JNote内容
    share: function(it) {

    },

    // 重置
    reset: function(it) {
        JNote.Context.clearRect(0, 0, JNote.w, JNote.h);
        $(".jiangyouhua-text").remove()
    },

    // 撤消
    undo: function() {
        JNote.Context.restore();
    },

    // 重做
    redo: function() {

    },

    // 触摸事件
    // 触摸开始
    touchStart: function(e) {
        JNote.drawStart(this.touch.pageX, this.touch.pageY)
        e.preventDefault()
    },

    // 触摸移动
    touchMove: function(e) {
        JNote.drawMove(this.touch.pageX, this.touch.pageY)
        e.preventDefault()
    },

    // 触摸结束
    touchEnd: function(e) {
        JNote.drawEnd(this.touch.pageX, this.touch.pageY)
        e.preventDefault()
    },

    // 鼠标事件
    // 鼠标按下
    mouseDown: function(e) {
        JNote.drawStart(e.pageX, e.pageY)
        e.preventDefault()
    },

    // 鼠标移动
    mouseMove: function(e) {
        JNote.drawMove(e.pageX, e.pageY)
        e.preventDefault()
    },

    // 鼠标拿起
    mouseUp: function(e) {
        JNote.drawEnd(e.pageX, e.pageY)
        e.preventDefault()
    },

    // 绘
    // 开始绘
    drawStart: function(x, y) {
        JNote.draw = !JNote.draw
        JNote.data.x = x
        JNote.data.y = y

        switch (JNote.data.t) {
            case 0:
                JNote.penStart(x, y)
                break;
            case 1:
                JNote.eraser(x, y)
                break
            case 3:
                JNote.cutStart(x, y)
                break
        }
    },

    // 绘
    drawMove: function(x, y) {
        if (!JNote.draw) {
            return
        }
        switch (JNote.data.t) {
            case 0:
                JNote.penMove(x, y)
                break;
            case 1:
                JNote.forPaht(x, y, function(_x, _y) {
                    JNote.eraser(_x, _y)
                })
                JNote.eraser(x, y)
                JNote.data.x = x
                JNote.data.y = y
                break
            case 3:
                JNote.cutMove(x, y)
                break
        }
    },

    // 结束
    drawEnd: function(x, y) {
        JNote.draw = false;
        switch (JNote.data.t) {
            case 2:
                JNote.textr(x, y)
                break
            case 3:
                JNote.cutEnd(x, y)
                break
        }
    },

    // 按路径绘图
    forPaht: function(x, y, callback) {
        // 获取路径
        var _x = Math.abs(JNote.data.x - x)
        var _y = Math.abs(JNote.data.y - y)
        var _z = Math.sqrt(_x * _x + _y * _y)

        // 分点绘图
        for (var i = 1; i < _z; i += JNote.data.s) {
            var wx = i * _x / _z
            var wy = i * _y / _z
            var w = JNote.data.x < x ? JNote.data.x + wx : JNote.data.x - wx
            var h = JNote.data.y < y ? JNote.data.y + wy : JNote.data.y - wy
            callback(w, h)
        }
    },

    // 擦除
    eraser: function(x, y) {
        // if()
        JNote.Context.globalCompositeOperation = "destination-out";
        JNote.Context.beginPath();
        JNote.Context.arc(x, y, JNote.data.s, 0, Math.PI * 2);
        JNote.Context.strokeStyle = "rgba(250,250,250,0)";
        JNote.Context.fill();
        JNote.Context.globalCompositeOperation = "source-over"
    },

    // 输文字
    textr: function(x, y) {
        var mark = Math.random().toString()
        var key = mark.replace("0.", "jiangyouhua-")
        var s = '<div class="jiangyouhua-text" id=' + key + ' style="position:absolute; z-index:2147483644; top:' + y + 'px; left:' + x + 'px;">' +
            '<img type="button" id="' + key + '-img" href="#" style="width:15px; height:15px;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjcyNDA4REY5OUQyNjExRTY4QzkyQUZFMzRDQTc3MkE3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjcyNDA4REZBOUQyNjExRTY4QzkyQUZFMzRDQTc3MkE3Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NzI0MDhERjc5RDI2MTFFNjhDOTJBRkUzNENBNzcyQTciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NzI0MDhERjg5RDI2MTFFNjhDOTJBRkUzNENBNzcyQTciLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7IjAc4AAAABlBMVEUAAAAAAAClZ7nPAAAAAnRSTlP/AOW3MEoAAACDSURBVHja7JVRCsAwCEPj/S892MfANotmFAbr/KrVR6uRFmEa9gYgbQaAHoFm/kV8EkjwEGBA4UxA8niI7sa4Lq50+sEjrOg8bGVbb/KFDjxfCUfzpdIhNlec4NbgdsnVwVXanqWH0wrmiRpyZ+ouZbW2eJe6gP3c+x/K/0+/ChwCDACZJAV9EIRMIgAAAABJRU5ErkJggg==">' +
            '<textarea rows="4" style="position: absolute; background: transparent; border: none; mix-blend-mode: multiply; color:' + JNote.data.c + '"></textarea>' +
            '</div>'
        $("body").append(s)
        $("#" + key + " textarea").focus()
        document.getElementById(key + '-img').addEventListener('click', JNote.erareText)
        JNote.data.t = 0
    },

    // 画笔
    // 画笔开始画
    penStart: function(x, y) {
        // 绘图
        JNote.Context.lineWidth = JNote.data.s
        JNote.Context.strokeStyle = JNote.data.c;
        JNote.Context.beginPath();
        JNote.Context.moveTo(x, y)
    },
    // 画笔移动
    penMove: function(x, y) {
        // 绘图
        JNote.Context.lineTo(x, y);
        JNote.Context.stroke();
    },

    // 裁切
    // 裁切开始
    cutStart: function(x, y) {
        if (!JNote.draw) {
            return
        }

        $("#jiangyouhua-cut-level").css("background", "rgba(0,0,0,0)")
        var canvas = "#jiangyouhua-cut-canvas"
        $(canvas).hide()
        $(canvas).css("width", "0")
        $(canvas).css("height", "0")
        $(canvas).css("border-width", "0")

        JNote.cutArea = {
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }
        JNote.screenShot()
    },

    // 裁切移动
    cutMove: function(x, y) {
        if (!JNote.draw) {
            return
        }
        var w = Math.abs(JNote.data.x - x)
        var h = Math.abs(JNote.data.y - y)
        var _x = JNote.data.x
        var _y = JNote.data.y

        if (x < JNote.data.x) {
            // 向左上拖动
            _x = x
            if (y < JNote.data.y) {
                // 向左下拖动
                _y = y
            }
        } else {
            // 向右上拖动
            if (y < JNote.data.y) {
                _y = y
            }
        }
        var c = document.getElementById("jiangyouhua-cut-canvas")
        $(c).css("left", _x)
        $(c).css("top", _y)
        $(c).css('width', w)
        $(c).css('height', h)
        $(c).css("background-position-x", -_x - JNote.Stroke + document.body.scrollLeft)
        $(c).css("background-position-y", -_y - JNote.Stroke + document.body.scrollTop)

        // 更新选择区
        JNote.cutArea = {
            x: _x - document.body.scrollLeft,
            y: _y - document.body.scrollTop,
            w: w,
            h: h
        }
    },

    // 截切结束
    cutEnd: function() {
        if (parseInt($("#jiangyouhua-cut-canvas").css("width")) < 10) {
            $("#jiangyouhua-cut-canvas").hide()
        }
    },

    // 显示裁切
    cutShow: function(url) {
        var level = document.getElementById("jiangyouhua-cut-level")
        var canvas = document.getElementById("jiangyouhua-cut-canvas")
        $(level).css("background", "rgba(0,0,0,.5)")
        if (!!url) {
            $(canvas).css("background-image", "url(" + url + ")")
            $(canvas).css("background-size", JNote.w + "px " + JNote.height + "px")
        }
        $(canvas).css("border-width", JNote.Stroke)
        $(level).show()
        $(canvas).show()
    },


    // 不再应用裁切工具
    cutHide: function() {
        $("#jiangyouhua-cut-level").hide()
        $("#jiangyouhua-cut-canvas").hide()
    },

    // 获取截屏，保存至JNote.Image
    screenShot: function(save) {
        // 隐藏非批注元素
        $("#jiangyouhua-tool").hide()
        $(".jiangyouhua-text img").hide()
        JNote.cutHide()
            // 延时切图，使蒙版层完成隐藏
        setTimeout(function() {
            chrome.extension.sendRequest({
                key: "ScreenShot",
                value: JNote.tab.id,
                save: save
            }, function(re) {})
        }, 25)
    },

    // 工具栏事件
    button: function(e) {
        // 功能
        var v = $(this).attr("data-value")

        if (isNaN(v)) {
            JNote[v](this);
            return
        }

        // 线宽
        var i = parseInt(v)
        if (!!i) {
            JNote.size(this, i)
            return
        }

        // 线色
        var color = $(this).css("background-color")
        JNote.color(this, color)
    },

    erareText: function(e) {
        $(this).parent().remove(0)
    },

    // 添加或移除监听
    listener: function(adds, removes) {
        for (var x in adds) {
            if (!adds[x]) {
                continue
            }
            adds[x].addEventListener("mousedown", JNote.mouseDown)
            adds[x].addEventListener("mousemove", JNote.mouseMove)
            adds[x].addEventListener("mouseup", JNote.mouseUp)
            adds[x].addEventListener("touchstart", JNote.touchStart)
            adds[x].addEventListener("touchmove", JNote.touchMove)
            adds[x].addEventListener("touchend", JNote.touchEnd)
        }

        for (var x in removes) {
            if (!removes[x]) {
                continue
            }
            removes[x].removeEventListener("mousedown", JNote.mouseDown)
            removes[x].removeEventListener("mousemove", JNote.mouseMove)
            removes[x].removeEventListener("mouseup", JNote.mouseUp)
            removes[x].removeEventListener("touchstart", JNote.touchStart)
            removes[x].removeEventListener("touchmove", JNote.touchMove)
            removes[x].removeEventListener("touchend", JNote.touchEnd)
        }
    },

    // 工具栏状态处理
    toolStat: function() {
        if (!($("#jiangyouhua-note").length)) {
            JNote.init()
            return
        }
        $("#jiangyouhua-note").toggle()
    },

    init: function() {
        // 网页内容宽、高，页面可视区宽、高
        JNote.Ratio = window.devicePixelRatio || 1
        JNote.h = document.body.clientHeight > document.body.scrollHeight ? document.body.clientHeight : document.body.scrollHeight
        JNote.w = JNote.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        JNote.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        $("body").append(JNote.Html(JNote.w, JNote.h))
        JNote.Canvas = document.getElementById("jiangyouhua-canvas")
        JNote.Context = JNote.Canvas.getContext("2d")
        var level = document.getElementById("jiangyouhua-cut-level")
        var canvas = document.getElementById("jiangyouhua-cut-canvas")
        JNote.listener([JNote.Canvas, level, canvas])

        // 添加工具按
        var btn = document.querySelectorAll("#jiangyouhua-tool button")
        for (var x = 0; x < btn.length; x++) {
            btn[x].addEventListener('click', JNote.button)
        }
    }
}

/**
 * 接收从background.js 传入的信息
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (!request) {
        return
    }

    switch (request.key) {
        case "ToolShow":
            JNote.toolStat()
            break
        case "CurrentTab":
            JNote.tab = request.value
            break
        case "ScreenShot":
            // 显示非批注元素
            $("#jiangyouhua-tool").show()
            $(".jiangyouhua-text img").show()

            JNote.Image = new Image()
            if (!!request.save) {
                // 下载当前内容
                JNote.load(request.value)
            } else {
                if (JNote.data.t == 3) {
                    JNote.cutShow(request.value)
                }
            }
            break
        case "ConfigServer":
            if (!!request.value) {
                JNote.Server = request.value
            }
            break
    }
});