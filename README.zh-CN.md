# Miniverto

[![CI](https://github.com/shuangtao-eng/miniverto/actions/workflows/ci.yml/badge.svg)](https://github.com/shuangtao-eng/miniverto/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/shuangtao-eng/miniverto)](LICENSE)
[![Release](https://img.shields.io/github/v/release/shuangtao-eng/miniverto?include_prereleases)](https://github.com/shuangtao-eng/miniverto/releases)

**语言 / Language:** [English](README.md) | 简体中文

Miniverto 是一个本地优先的 AI 学习规划器。它可以把一个宏大的学习目标转化为可执行的学习计划、结构化课程、练习循环和可长期沉淀的笔记。

多数学习工具默认你已经知道自己要学什么。Miniverto 更早一步介入：它帮助你梳理模糊目标、结合你的背景和可用材料，再把这些上下文变成真正可以跟着执行的计划。

> 状态：alpha。Miniverto 目前适合本地规划实验、代码审阅和开源协作，还不是一个打磨完成的消费者级稳定版本。

![Miniverto dashboard](docs/assets/hero-dashboard.png)

## 为什么做 Miniverto

学习常常不是因为不努力而失败，而是因为计划太泛、周期太长，或者和学习者已有基础脱节。Miniverto 围绕一个更贴近真实学习的循环设计：

1. 定义目标和当前起点。
2. 添加学习材料或现实约束。
3. 生成包含里程碑和任务结果的实用计划。
4. 在聚焦的任务页面中学习、记录笔记并完成评估。
5. 当理解发生变化时重新规划。

这个产品的核心判断很简单：一个好的学习应用不应该只是静态教学大纲，而应该更像一个记得你上下文的私人导师。

![Miniverto learning loop](docs/assets/product-loop.svg)

## 当前可以做什么

- 创建包含里程碑和任务的结构化学习项目。
- 收集学习者背景、时间预算、设备、阻碍因素和偏好学习方式等信息。
- 在没有可用实时模型端点时，生成确定性的应用内学习计划。
- 在配置后调用前端可访问的 OpenAI 兼容本地端点，例如 Ollama 或本地 relay。
- 使用 SQLite 在本地保存项目数据、学习材料、笔记、评估和模型服务配置。
- 通过 Tauri 命令把 API key 存入操作系统凭据存储。
- 将纯文本和 Markdown 材料导入本地材料库。
- 跟踪任务进度、任务笔记、知识笔记和评估结果。
- 运行当前核心行为的前端和 Rust 测试套件。

## 产品截图

![Miniverto project detail](docs/assets/project-detail.png)

![Miniverto learning workspace](docs/assets/learning-workspace.png)

## Alpha 阶段的真实情况

Miniverto 是在尚未完成时主动开源的。当前仓库最适合想要查看代码、运行体验、改进方向或 fork 探索的人。

已知限制：

- Windows 是目前已验证的桌面开发目标。
- macOS 和 Linux 按照 Tauri 架构预期可以支持，但还需要平台级验证，尤其是 keyring 集成。
- 设置页面已经有模型服务配置和 key 存储能力，但“测试连接”流程目前仍是 UI 层面的成功模拟。
- 通过已保存 API key 调用云端模型的端到端生成尚未完全接通。如果选择了需要 key 的云端 provider，应用目前会回退到确定性的应用内计划生成。
- 材料解析目前支持纯文本和 Markdown。PDF、幻灯片和音频可以被分类，但尚未完整解析。
- 安全加固、发布签名和安装包分发仍在路线图中。

## 隐私模型

Miniverto 被设计为本地优先的桌面应用。

- 应用数据存储在本地 SQLite 中。
- API key 通过操作系统凭据存储保存，不写入项目数据库。
- 学习材料默认保留在本地。
- 当启用实时模型调用时，选中的规划上下文可能会发送给已配置的模型服务。用户在发送敏感材料前，应确认 provider 端点和隐私预期。

## 技术栈

- 前端：React、TypeScript、Vite、Tailwind CSS、TanStack Router、Zustand、Vitest。
- 桌面外壳：Tauri 2。
- 原生层：Rust、rusqlite、keyring。
- 存储：本地 SQLite，以及用于保存密钥的操作系统凭据存储。

![Miniverto local-first architecture](docs/assets/local-first-architecture.svg)

## 开始使用

前置要求：

- Node.js 22 或更新版本。
- npm 11 或更新版本。
- Rust stable toolchain。
- Windows 是目前已验证的桌面目标。

安装依赖：

```bash
npm ci
```

运行 Web UI 开发模式：

```bash
npm run dev
```

运行 Tauri 桌面应用：

```bash
npm run tauri:dev
```

运行检查：

```bash
npm run check
```

构建前端：

```bash
npm run build
```

构建桌面应用：

```bash
npm run tauri:build
```

## 仓库结构

```text
src/              React 应用、产品流程、服务、状态和测试
src-tauri/        Tauri 应用、Rust commands、SQLite stores、keyring bridge
public/           静态资源
docs/             产品、路线图、架构和 GitHub 发布说明
.github/          CI workflow 和贡献模板
```

## 产品方向

Miniverto 正在朝一个私有学习操作系统演进：

- 默认本地优先。
- 灵活支持不同模型服务。
- 围绕真实学习循环构建，而不只是任务列表。
- 诚实面对不确定性、进度、复习和重新规划。

近期计划见 [docs/ROADMAP.md](docs/ROADMAP.md)。

## 参与贡献

项目还处在足够早期的阶段，欢迎开发者一起塑造方向。适合开始贡献的方向包括：

- 通过原生 keyring 路径接通云端模型运行时。
- 验证 macOS 和 Linux 支持。
- PDF 和文档材料导入。
- 更好的评估和重新规划循环。
- 可访问性和键盘驱动工作流。
- Tauri CSP 和 provider 调用的安全加固。

提交 pull request 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

Apache-2.0。详见 [LICENSE](LICENSE)。

npm package 被标记为 `private`，用于避免意外发布 npm 包。本仓库源码采用 Apache-2.0 许可证。

作者：kevin tao。
