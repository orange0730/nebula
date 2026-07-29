# 貢獻指南

Nebula 是 [orange0730](https://github.com/orange0730) 主導的專案,但歡迎任何人
提交 Issue 或 Pull Request。審查與回覆速度可能不像大型專案那麼快,請見諒。

## 開發環境設定

需求:Node.js 22+、pnpm。

```bash
# 1. Fork 這個 repo,然後 clone 你自己的 fork
git clone https://github.com/<你的帳號>/nebula.git
cd nebula

# 2. 安裝相依套件
pnpm install

# 3. 建置
pnpm build

# 4. 注入到本機的 Discord(需要先安裝好 Discord)
pnpm inject
# 選擇你的 Discord 安裝路徑,注入完成後重啟 Discord
```

改完程式碼後,重跑 `pnpm build` 再重啟 Discord 就能看到效果。開發時常用 `pnpm buildWatch` 讓改動自動重新編譯。

外掛程式碼放在 `src/userplugins/liveTheme/` 和 `src/userplugins/freeMode/`,架構與一般 Vencord 外掛相同,
可以參考 [Vencord 官方外掛開發文件](https://docs.vencord.dev)。

## 提交 Pull Request 的流程

1. 從 `main` 開一個新分支,分支名稱盡量說明改動內容(例如 `fix/livetheme-panel-opacity`)
2. 進行改動,並**實際在 Discord 裡測試過**再送出 PR——這是個 Discord 客戶端修改工具,光是型別檢查過
   不代表功能真的能動
3. 大幅度的改動(新增外掛、改變核心架構)建議先開 [Issue](../../issues) 討論方向,避免白工
4. 送出 PR 時請照 PR 範本說明改了什麼、怎麼測試的
5. 一個 PR 請只處理一件事,不要夾帶不相關的改動,這樣比較容易審查

## 這個 repo 跟 Vencord 官方專案的關係

Nebula 是基於 [Vencord](https://github.com/Vendicated/Vencord) 延伸的個人 fork,詳見
[README.md](README.md) 的授權與致謝章節。如果你的想法比較適合回饋給 Vencord 官方(例如通用型外掛、
核心框架改進),建議直接到 [Vencord 官方 repo](https://github.com/Vendicated/Vencord) 貢獻,那邊有
完整的社群與文件。這個 repo 主要專注在 Nebula 自己的 LiveTheme、Free Mode 這些外掛。
