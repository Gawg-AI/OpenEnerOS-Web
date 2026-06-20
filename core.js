/* ============================================================
   EnerOS CORE · 长卷交互脚本
   - 内核事件流终端滚动
   - 遥测数字微动 + sparkline 更新
   ============================================================ */
(function () {
  'use strict';

  /* ============ 内核事件流终端 ============ */
  function initTerminal() {
    var body = document.getElementById('termBody');
    if (!body) return;

    var events = [
      ['12:04:21.847', 'info', 'topology', 'Bus_07 合环成功，当前拓扑节点 1284'],
      ['12:04:21.902', 'ok',   'powerflow', '潮流收敛：迭代 4 次，最大失配 0.0002 pu'],
      ['12:04:22.015', 'warn', 'constraint', 'Bus_03 电压越上限 1.062pu，触发约束'],
      ['12:04:22.018', 'act',  'dispatch', '调度 Agent：投切 Bus_03 #2 电容器组'],
      ['12:04:22.203', 'ok',   'powerflow', '重校验通过，电压恢复 1.048pu'],
      ['12:04:22.410', 'info', 'eventbus', '事件 DISPATCH_CAP_7302 已广播至 6 Agent'],
      ['12:04:22.988', 'act',  'ops', '运维 Agent：Bus_05 红外测温 +2.3℃ 进入观察'],
      ['12:04:23.301', 'info', 'timeseries', '采样率 100Hz，缓冲窗口 30s 已滚动'],
      ['12:04:23.640', 'ok',   'selfheal', '故障区段 F-12 隔离完成，转供恢复 1.2s'],
      ['12:04:24.012', 'act',  'trading', '交易 Agent：申报调频容量 +18MW'],
      ['12:04:24.355', 'info', 'gateway', 'IEC61850 会话保持，心跳 RTT 12ms'],
      ['12:04:24.700', 'ok',   'constraint', 'N-1 校验通过，全网裕度充足'],
      ['12:04:25.021', 'warn', 'constraint', '线路 L-08 负载率 87% 接近阈值'],
      ['12:04:25.024', 'act',  'planning', '规划 Agent：建议新建 220kV 线路冗余'],
      ['12:04:25.510', 'info', 'device', '设备抽象层注册新终端 DTU-3301'],
      ['12:04:25.888', 'ok',   'audit', '动作审计落库：决策链 7 步全可追溯'],
      ['12:04:26.200', 'act',  'efficiency', '能效 Agent：源网荷储协调降损 0.4%'],
      ['12:04:26.540', 'info', 'network', '集群节点 N3 心跳正常，负载均衡 OK']
    ];

    var tagLabel = {
      topology: 'TOPO', powerflow: 'FLOW', constraint: 'CONS', dispatch: 'DSP',
      eventbus: 'BUS', ops: 'OPS', timeseries: 'TS', selfheal: 'HEAL',
      trading: 'TRD', gateway: 'GW', device: 'DEV', planning: 'PLN',
      audit: 'AUD', efficiency: 'EFF', network: 'NET'
    };
    var idx = 0;
    var maxLines = 12;

    function addLine() {
      var e = events[idx % events.length];
      idx++;
      var tag = tagLabel[e[3]] || e[3];
      var line = document.createElement('div');
      line.className = 'term-line';
      line.innerHTML =
        '<span class="term-time">' + e[0] + '</span>' +
        '<span class="term-tag t-' + e[1] + '">' + tag + '</span>' +
        '<span class="term-msg">' + e[4] + '</span>';
      body.appendChild(line);
      // 保持最多 maxLines 行
      while (body.children.length > maxLines) {
        body.removeChild(body.firstChild);
      }
      body.scrollTop = body.scrollHeight;
    }
    // 初始填充
    for (var i = 0; i < maxLines; i++) addLine();
    setInterval(addLine, 1400);
  }

  /* ============ 遥测数字微动 + sparkline ============ */
  function initTelemetry() {
    var cells = document.querySelectorAll('.tele-cell');
    if (!cells.length) return;
    cells.forEach(function (cell, ci) {
      var valEl = cell.querySelector('.tele-val');
      if (!valEl) return;
      var unitEl = valEl.querySelector('.tele-unit');
      var unit = unitEl ? unitEl.textContent : '';
      var raw = valEl.firstChild.textContent.trim();
      // 解析基础数值（去掉逗号）
      var num = parseFloat(raw.replace(/,/g, ''));
      var isFloat = raw.indexOf('.') >= 0;
      // sparkline 柱
      var bars = cell.querySelectorAll('.tele-spark span');
      setInterval(function () {
        // 数值微动
        var delta = (Math.random() - 0.5) * (isFloat ? 0.08 : (num > 100 ? 30 : 4));
        var newNum = num + delta;
        var display;
        if (isFloat) {
          display = newNum.toFixed(2);
        } else {
          display = Math.round(newNum).toLocaleString('en-US');
        }
        valEl.firstChild.textContent = display;
        // sparkline 滚动
        if (bars.length) {
          for (var i = 0; i < bars.length - 1; i++) {
            bars[i].style.height = bars[i + 1].style.height;
          }
          bars[bars.length - 1].style.height = (20 + Math.random() * 80) + '%';
        }
      }, 1800 + ci * 120);
    });
  }

  /* ============ 启动 ============ */
  function boot() {
    initTerminal();
    initTelemetry();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
