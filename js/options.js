var config = {
    Server :function () {
        var s = document.getElementById('config-server').value
        localStorage.setItem("server", s)
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('submit').addEventListener('click', config.Server);
});