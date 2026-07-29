# 貢獻指南

Nebula 是 [orange0730](https://github.com/orange0730) 的個人專案,主要由自己搭配 AI 協作開發與維護,
目前沒有像 Vencord 那樣完整的社群貢獻流程。

如果你想回報問題或提出想法,歡迎直接開 [GitHub Issue](../../issues)。如果你想送 PR,也歡迎,但請注意:

- 這是個人專案,審查與回覆的速度可能不快
- 大幅度的改動建議先開 Issue 討論方向,避免白工
- 請說明改動的原因與測試方式

## 這個 repo 跟 Vencord 官方專案的關係

Nebula 是基於 [Vencord](https://github.com/Vendicated/Vencord) 延伸的個人 fork,詳見
[README.md](README.md) 的授權與致謝章節。如果你的想法比較適合回饋給 Vencord 官方(例如通用型外掛、
核心框架改進),建議直接到 [Vencord 官方 repo](https://github.com/Vendicated/Vencord) 貢獻,那邊有
完整的社群與文件(<https://docs.vencord.dev>)。這個 repo 主要專注在 Nebula 自己的
LiveTheme、Free Mode 這些外掛。

## 開發環境

```bash
pnpm install
pnpm build
pnpm inject
```
