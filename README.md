# 本地计算器

这是一个纯前端、离线优先的计算器网页，不需要 Java、数据库或自己的服务器程序。

## 功能

- 加、减、乘、除、小数、正负号和百分比
- 最终结果四舍五入，最多保留两位小数
- 完整保存计算表达式和结果
- 历史记录按今天、昨天和具体日期分组
- 支持删除单条、清空某天和清空全部历史
- 历史记录保存在当前浏览器的 `localStorage`
- 添加到 iPhone 主屏幕后可作为独立应用打开
- 首次在线打开成功后支持离线启动

## 本地预览

在项目目录执行：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://localhost:4173/
```

不能直接双击 `index.html` 验证离线功能，因为 Service Worker 需要通过 HTTP 或 HTTPS 运行。

## 发布到 GitHub Pages

1. 创建一个 GitHub 仓库并上传本目录全部文件。
2. 在仓库的 **Settings → Pages** 中选择从分支发布。
3. 选择包含这些文件的分支和根目录，保存设置。
4. 等待 GitHub Pages 给出 HTTPS 网页地址。

所有资源都使用相对路径，因此可以发布在 GitHub Pages 的项目子目录中。

发布代码更新时，请同时修改 `service-worker.js` 中的 `CACHE_NAME` 版本，例如从 `local-calculator-v1` 改为 `local-calculator-v2`，确保已经安装的设备获取新文件。更新缓存不会删除 `localStorage` 中的历史记录。

## 添加到 iPhone 主屏幕

1. 使用 Safari 打开 GitHub Pages 地址。
2. 点击 Safari 底部的分享按钮。
3. 选择“添加到主屏幕”。
4. 确认名称后点击“添加”。
5. 至少在线完整打开一次，之后断网时通常仍可启动和计算。

历史记录只保存在当前手机和当前网页地址下。清除 Safari 网站数据、删除主屏幕应用数据或系统回收站点数据后，记录可能丢失。
