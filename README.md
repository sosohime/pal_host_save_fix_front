# 帕鲁本地服务存档迁移至社区服务器

## 依赖

- nodejs >=16.18.1
- python3
- rust

## 使用方法

1. 用户逐个登陆本地服务器，按修改时间确认自己的存档`<old_uid>`

2. 用户逐个登陆新建的社区服务器，记录自己新生成的`<new_uid>`

3. 本地存档压缩为zip后上传，格式如下图
![上传](/docs/upload.jpg)
![压缩包格式](/docs/file.jpg)

4. 在`<old_uid>`后面输入`<new_uid>`
![uid](/docs/uid.jpg)

5. 等待生成

6. 点击下载，享受

## 部署

1. 记录自己安装uesave的bin路径（如`'/Users/heyesheng/.cargo/bin/uesave'`），替换掉`api/pal/fix.ts`中的`UE_SAVE_PATH`配置

2. 修改后的存档会压缩放到`./fixed`目录中，需要nginx做一下代理，访问`/download/xxx.zip`直接下载

## Setup

安装`uesave`（依赖rust）

```bash
cargo install --git https://github.com/trumank/uesave-rs.git
```

Install the dependencies:

```bash
pnpm install
```

## Get Started

Start the dev server:

```bash
pnpm dev

```

Build the app for production:

```bash
pnpm build
```

production bff

```bash
pnpm start
```

For more information, see the [Modern.js documentation](https://modernjs.dev/en).
