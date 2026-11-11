# AMZ Skills

Amazon 运营、广告、VOC、竞品、关键词、Listing、视频与经营复盘相关的 Codex Skills 集合。

## 目录

- `skills/`：每个子目录是一项独立 Skill。
- `SKILL.md`：Skill 的触发条件、工作流程和交付规范。
- `agents/`：可选的代理配置。
- `references/`：分析口径、数据源和模板说明。
- `scripts/`：可复用的辅助脚本。

当前收录 34 项自定义 Skill，包括 Amazon 广告与 B2B 分析、竞品研究、关键词资产、评论 VOC、Listing 文案与视觉策略、视频策略、周/月经营复盘等。

## 安装

将需要的 Skill 目录复制到 Codex Skills 目录：

```text
~/.codex/skills/<skill-name>/
```

保持 `SKILL.md` 和其引用的 `agents/`、`references/`、`scripts/` 相对路径不变。

## 凭据与数据安全

仓库不包含 Cookie、API 密钥、飞书应用密钥、原始业务数据或生成报告。需要外部服务的脚本通过环境变量读取配置，常见变量包括：

```text
FEISHU_APP_ID
FEISHU_APP_SECRET
FEISHU_BASE_TOKEN
FEISHU_TABLE_ID
FEISHU_MAIN_TABLE_ID
FEISHU_AGING_TABLE_ID
FEISHU_HOST
```

不要把真实凭据写入代码或提交到 Git。

## 说明

部分 Skill 依赖本地 MCP 服务、飞书多维表格或第三方 Amazon 数据服务。使用前请阅读对应目录中的 `SKILL.md`，并按需配置运行环境。

