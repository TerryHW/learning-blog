# MySQL 使用参考手册

> 版本基线：**MySQL 8.0 / 8.4 LTS / 9.7 LTS**（以 InnoDB 为唯一默认存储引擎，`utf8mb4` 为默认字符集）
> 编写时间：2026-09-22
> 用途：日常开发与运维的 MySQL 操作速查手册。命令中的密码、主机、账号均为**占位值**，请勿直接复制到生产执行。

## 0. 使用本文档前必须知道的 5 件事

1. **版本决定语法**。本文默认 8.0 及以上。5.7 已 EOL（2023-10），8.0 已 EOL（2026-04，最后一个版本 8.0.46）。新部署请选 **8.4 LTS** 或 **9.7 LTS**。5.7 的差异在正文中标注 `[5.7]`。
2. **先看执行计划，再谈优化**。任何"这条 SQL 慢"的结论，都要有 `EXPLAIN` / `EXPLAIN ANALYZE` 证据，不能凭语句外观判断。
3. **生产变更三件套**：精确目标（哪个库、哪张表、多少行）、影响面（锁、复制延迟、磁盘）、回滚方式（备份或逆向语句）。三者缺一，不要执行。
4. **`UPDATE` / `DELETE` 先用同条件 `SELECT` 核对范围**，再执行写入。
5. **`DROP` / `TRUNCATE` / 无 `WHERE` 的 `DELETE` / `ALTER` 大表** 属于高危操作，见第 40 章《危险操作清单》。

---

# 第一部分　安装、配置、运行、登录

## 1. 版本选择与前置检查

### 1.1 版本选择建议（截至 2026-09）

| 版本 | 类型 | 生命周期状态 | 建议 |
| --- | --- | --- | --- |
| 9.7 | LTS | 2026-04 发布，支持至 2034 | **新项目首选**，功能最全 |
| 8.4 | LTS | 2024-04 发布，Premier 至 2029-04 | **稳妥之选**，生态兼容性最好 |
| 8.0 | LTS | **2026-04 已 EOL**（8.0.46 为末版） | 存量系统尽快升级到 8.4/9.7 |
| 9.0～9.6 | Innovation | 均为短期版本，多数已 EOL | 不建议用于生产长期运行 |
| 5.7 | — | 2023-10 EOL | 仅历史系统维护 |

> 说明：8.0 自 2026-04-21 起进入 Oracle Sustaining Support（仅安全补丁，无新功能/无版本升级通道），不建议再作为新项目基线。

### 1.2 环境前置检查（安装前）

- 主机：CPU 核数、内存（决定 `innodb_buffer_pool_size` 上界）、数据盘与日志盘分离情况、是否 SSD。
- 操作系统：内核版本、发行版（决定安装包方式）、SELinux / AppArmor 状态、防火墙端口策略。
- 端口：默认 3306，确认未被占用（`ss -lntp | grep 3306`）。
- 目录：数据目录（`datadir`）、日志目录、临时目录所在分区剩余空间 ≥ 预期数据量的 2 倍。
- 时间：所有节点启用 NTP/chrony 时间同步（复制、GTID、审计都依赖时间一致）。
- 字符集：业务是否需要 emoji / 生僻字（决定必须使用 `utf8mb4`，不能用 `utf8`/`utf8mb3`）。

## 2. 安装

### 2.1 Windows

**方式 A：MySQL Installer（推荐给单机开发）**

1. 下载 `mysql-installer-community-<version>.msi`，运行后选择 "Custom"。
2. 勾选 MySQL Server、MySQL Shell、Workbench、Connectors。
3. 配置向导：Config Type 选 Development/Server，端口 3306，认证方式建议 `Use Strong Password Encryption`。
4. 设置 root 密码并妥善保存；勾选 "Configure MySQL Server as a Windows Service"。

**方式 B：ZIP 免安装包（推荐给需要自定义目录的场景）**

```powershell
# 1) 解压到 D:\mysql\mysql-8.4（路径不要含中文和空格）
# 2) 在 D:\mysql\my.ini 写配置（见第 3 章），至少包含 basedir / datadir
# 3) 初始化数据目录（会生成随机 root 临时密码，记录在错误日志中）
D:\mysql\mysql-8.4\bin\mysqld.exe --defaults-file=D:\mysql\my.ini --initialize --console

# 4) 注册为 Windows 服务并启动
D:\mysql\mysql-8.4\bin\mysqld.exe --install MySQL84 --defaults-file=D:\mysql\my.ini
net start MySQL84
# 停止：net stop MySQL84    卸载服务：sc delete MySQL84
```

> `--initialize` 生成随机密码；`--initialize-insecure` 生成空密码 root（**仅限本地学习**，初始化后立刻改密码）。

### 2.2 Linux（RPM 系：RHEL / Rocky / Alma / Oracle Linux）

```bash
# 1) 安装官方仓库（以 el9 为例，实际请按官网给的 rpm 包名）
sudo rpm -Uvh https://dev.mysql.com/get/mysql84-community-release-el9-1.noarch.rpm

# 2) 安装 server 与客户端工具
sudo dnf install -y mysql-community-server mysql-community-client mysql-shell

# 3) 启动并设为开机自启
sudo systemctl enable --now mysqld
sudo systemctl status mysqld

# 4) 取初始随机密码
sudo grep 'temporary password' /var/log/mysqld.log

# 5) 安全初始化（改 root 密码、删匿名用户、禁 root 远程、删 test 库）
sudo mysql_secure_installation
```

### 2.3 Linux（DEB 系：Ubuntu / Debian）

```bash
sudo apt update
sudo apt install -y mysql-server mysql-client
sudo systemctl enable --now mysql          # 注意服务名是 mysql
sudo mysql_secure_installation
# Ubuntu 下 root 默认走 auth_socket，本地直接 sudo mysql 即可登录
```

### 2.4 macOS

```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### 2.5 Docker（最省事的验证环境）

```bash
docker run -d --name mysql84 \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD='<强密码>' \
  -e MYSQL_DATABASE=shop \
  -e MYSQL_CHARACTER_SET_SERVER=utf8mb4 \
  -e MYSQL_COLLATION_SERVER=utf8mb4_0900_ai_ci \
  -e TZ=Asia/Shanghai \
  -v mysql84-data:/var/lib/mysql \
  --restart unless-stopped \
  mysql:8.4
```

> 生产不建议用容器默认参数直接跑；容器内数据卷必须落在持久化存储，且要确认 `innodb_buffer_pool_size` 与宿主内存匹配。

### 2.6 安装后自检

```sql
SELECT VERSION();                                  -- 版本
SELECT @@version_comment;                          -- 发行版说明（Oracle/Percona/云厂商）
SHOW VARIABLES LIKE 'character_set_server';
SHOW VARIABLES LIKE 'collation_server';
SELECT @@sql_mode;                                 -- 确认 ONLY_FULL_GROUP_BY 是否开启
SELECT @@default_storage_engine;                   -- 应为 InnoDB
SELECT @@time_zone, @@system_time_zone;
SHOW ENGINES;                                      -- 引擎可用性
```

## 3. 配置文件与关键参数

### 3.1 配置文件位置与读取顺序

| 平台 | 路径 |
| --- | --- |
| Linux | `/etc/my.cnf`、`/etc/mysql/my.cnf`、`$MYSQL_HOME/my.cnf`、`~/.my.cnf` |
| Windows | `C:\ProgramData\MySQL\MySQL Server 8.4\my.ini` 或自定义 `--defaults-file` |

确认实际生效的配置文件：

```sql
SELECT @@global.datadir, @@global.basedir;
-- 命令行查看读取顺序：mysqld --verbose --help | head -30
```

### 3.2 一份可用的 `my.cnf` 模板（8.4 / 9.7）

```ini
[mysqld]
# ---------- 基础路径 ----------
user                    = mysql
basedir                 = /usr/local/mysql
datadir                 = /data/mysql/data
socket                  = /data/mysql/mysql.sock
pid-file                = /data/mysql/mysql.pid
tmpdir                  = /data/mysql/tmp
log-error               = /data/mysql/error.log

# ---------- 网络 ----------
bind-address            = 0.0.0.0
port                    = 3306
max_connections         = 1000
max_connect_errors      = 1000
skip_name_resolve       = ON

# ---------- 字符集与时区 ----------
character_set_server    = utf8mb4
collation_server        = utf8mb4_0900_ai_ci
default_time_zone       = '+08:00'
log_timestamps          = SYSTEM

# ---------- InnoDB ----------
innodb_buffer_pool_size = 8G          # 通常设为物理内存的 50%~70%
innodb_buffer_pool_instances = 8
innodb_redo_log_capacity = 2G         # 8.0.30+ 用该参数替代 innodb_log_file_size
innodb_flush_log_at_trx_commit = 1    # 金融级不丢事务
innodb_flush_method     = O_DIRECT
innodb_file_per_table   = ON
innodb_io_capacity      = 2000
innodb_io_capacity_max  = 4000

# ---------- 二进制日志（复制 / PITR 的基石） ----------
server_id               = 1001
log_bin                 = /data/mysql/binlog/mysql-bin
binlog_expire_logs_seconds = 604800   # 保留 7 天，按 RPO 调整
max_binlog_size         = 512M
sync_binlog             = 1
gtid_mode               = ON
enforce_gtid_consistency = ON           # 8.4+ 默认即为 ON
# binlog_format 默认已是 ROW，无需显式设置（8.0.34 起已弃用该变量）

# ---------- 慢日志（性能问题的主要证据来源） ----------
slow_query_log          = ON
slow_query_log_file     = /data/mysql/slow.log
long_query_time         = 1
log_queries_not_using_indexes = OFF     # 开启会污染慢日志，仅排障期临时开
min_examined_row_limit  = 100

# ---------- 每连接内存乘数（×max_connections 计入总内存） ----------
sort_buffer_size        = 4M
join_buffer_size        = 4M
read_buffer_size        = 2M
tmp_table_size          = 64M
max_heap_table_size     = 64M

[client]
default-character-set   = utf8mb4

[mysql]
default-character-set   = utf8mb4
prompt                  = '\u@\h:\d> '
```

**8.4 / 9.x 变更提醒：**

- `innodb_log_file_size`、`innodb_log_files_in_group` 已被 `innodb_redo_log_capacity` 取代。
- `default_authentication_plugin` 已移除，改用 `authentication_policy`。
- `mysql_native_password` 在 8.4 默认**不加载**（仅兼容老客户端时临时启用，属技术债）。
- `binlog_format`、`mysqlpump` 等已在 8.0.34 标记弃用，新环境不要依赖。
- `lower_case_table_names` 只在**初始化时**可设（0=区分大小写，1=不区分），安装后再改会导致数据字典不一致。

### 3.3 参数修改的安全姿势

```sql
-- 只读查看
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SELECT @@global.max_connections, @@session.max_connections;

-- 动态修改：会话级（只影响当前连接）
SET SESSION long_query_time = 0.5;

-- 动态修改：全局级（立即生效，重启后失效）
SET GLOBAL max_connections = 2000;

-- 动态修改并写盘（需 SYSTEM_VARIABLES_ADMIN 权限）
SET PERSIST max_connections = 2000;
SET PERSIST_ONLY innodb_buffer_pool_size = 16G;   -- 静态参数：只写盘，重启生效

RESET PERSIST max_connections;                     -- 撤销持久化设置
```

> 规则：**先算内存上界**（`buffer_pool + redo + 每连接缓冲 × 连接数`），再改参数。改完必须验证：连接数、复制延迟、慢查询数量、OOM 与否。

## 4. 启动、停止、运行

### 4.1 systemd 管理（Linux）

```bash
sudo systemctl start   mysqld     # Debian 系为 mysql
sudo systemctl stop    mysqld
sudo systemctl restart mysqld     # 生产重启前务必确认应用可断连重试
sudo systemctl status  mysqld
sudo systemctl enable  mysqld     # 开机自启
sudo systemctl disable mysqld

journalctl -u mysqld -n 200 --no-pager        # 服务日志
tail -f /data/mysql/error.log                 # MySQL 错误日志（更准）
```

### 4.2 Windows 服务

```powershell
net start MySQL84
net stop  MySQL84
sc query  MySQL84
```

### 4.3 前台调试启动（排障用）

```bash
mysqld --defaults-file=/etc/my.cnf --console            # 前台，日志输出到控制台
mysqld --defaults-file=/etc/my.cnf --validate-config    # 仅校验配置，不启动
mysqld_safe --defaults-file=/etc/my.cnf &               # 守护方式拉起（部分发行版）
```

### 4.4 判断"是否正常在跑"

```sql
SHOW GLOBAL STATUS LIKE 'Uptime';                       -- 运行秒数，突然变小=重启过
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL STATUS LIKE 'Aborted_connects';             -- 大量增长=连接被拒/认证失败
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_wait_free'; -- 大量增长=缓冲池不足
SHOW PROCESSLIST;                                       -- 当前线程
```

## 5. 登录与客户端连接

### 5.1 常用登录方式

```bash
# 本地 socket 登录（Linux 推荐，不受 bind-address 限制）
mysql -S /data/mysql/mysql.sock -u root -p

# TCP 登录
mysql -h 127.0.0.1 -P 3306 -u app_rw -p

# 指定字符集（避免中文乱码）
mysql -h 127.0.0.1 -u app_rw -p --default-character-set=utf8mb4

# 一条命令执行后退出
mysql -h 127.0.0.1 -u app_rw -p -e "SHOW DATABASES;"

# 执行 SQL 文件
mysql -h 127.0.0.1 -u app_rw -p shop < schema.sql
```

### 5.2 避免密码进历史记录（推荐）

```bash
# 方式一：交互式创建加密登录路径 ~/.mylogin.cnf
mysql_config_editor set --login-path=prod --host=127.0.0.1 --user=app_rw --password
mysql --login-path=prod shop
mysql_config_editor print --all          # 查看（密码仍为掩码）

# 方式二：配置文件 + 严格权限
# ~/.my.cnf :  [client]  user=app_rw  password=***
chmod 600 ~/.my.cnf
```

> **禁止**在命令行 `-p明文密码`（会进入 history 和 `ps` 输出），也不要把密码写进仓库。

### 5.3 `mysql` 客户端常用快捷命令

| 命令 | 作用 |
| --- | --- |
| `help` / `\h` | 帮助 |
| `status` / `\s` | 当前连接信息（版本、字符集、端口） |
| `use db` / `\u db` | 切换库 |
| `show databases` | 列库 |
| `source file.sql` / `\\.` | 执行 SQL 文件 |
| `tee /tmp/out.log` | 输出同时写文件 |
| `\G` | 替代分号，竖排显示结果（宽表友好） |
| `\c` | 取消当前输入 |
| `prompt \u@\h:\d>` | 自定义提示符 |

## 6. 账户与权限（安全基础）

### 6.1 创建账号与授权

```sql
-- 8.0+ 必须先 CREATE USER，GRANT 不再隐式建号
CREATE USER 'app_rw'@'10.0.1.%' IDENTIFIED BY '<强密码>';

-- 应用账号：只给业务必需的 DML + 必要 DQL
GRANT SELECT, INSERT, UPDATE, DELETE ON shop.* TO 'app_rw'@'10.0.1.%';

-- 只读报表账号
CREATE USER 'bi_ro'@'10.0.2.%' IDENTIFIED BY '<强密码>';
GRANT SELECT ON shop.* TO 'bi_ro'@'10.0.2.%';

-- 库级 DDL 权限交给 DBA 专用账号，不给应用
CREATE USER 'dba_ddl'@'10.0.1.10' IDENTIFIED BY '<强密码>';
GRANT ALTER, CREATE, DROP, INDEX ON shop.* TO 'dba_ddl'@'10.0.1.10';

FLUSH PRIVILEGES;   -- 只有直接改 mysql 库表时才需要
```

### 6.2 查询、回收、删除

```sql
SHOW GRANTS FOR 'app_rw'@'10.0.1.%';
SELECT user, host, plugin, account_locked FROM mysql.user;
REVOKE DELETE ON shop.* FROM 'app_rw'@'10.0.1.%';
ALTER USER 'app_rw'@'10.0.1.%' IDENTIFIED BY '<新密码>';
DROP USER 'app_rw'@'10.0.1.%';
```

### 6.3 权限治理要点

- 账号标识为 `user@host`，`'%'` 是任意主机，**生产应用账号应绑定网段**。
- 高风险权限（`SUPER`、`FILE`、`PROCESS`、`SHUTDOWN`、`REPLICATION ADMIN`、`SYSTEM_VARIABLE_ADMIN`）不得扩散到业务账号。
- 管理账号与应用账号分离；能走 TLS 就走（`CREATE USER ... REQUIRE SSL`）。
- 定期核对 `mysql.user`、`mysql.role_edges` 与离职人员清单。
- 8.0+ 默认插件 `caching_sha2_password`；老客户端连不上时应升级客户端，而不是退回 `mysql_native_password`。

## 7. 升级注意（简述）

- 升级前：全量备份 + 恢复演练、核对 `mysqlsh -- util checkForServerUpgrade` 报告、确认弃用参数。
- 跨大版本**不支持降级**，务必先在预演环境走通。
- 8.0 → 8.4：确认认证插件、`mysql_native_password` 依赖、弃用参数已清理。
- 8.4 → 9.7：确认 `SHOW MASTER STATUS` / `RESET MASTER` 等旧语法替换（见 36 章）。

---

# 第二部分　数据库与数据表操作

## 8. 数据库（schema）操作

```sql
-- 创建（显式指定字符集，别依赖默认值）
CREATE DATABASE IF NOT EXISTS shop
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

-- 查看
SHOW DATABASES;
SHOW CREATE DATABASE shop;
SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA;

-- 切换 / 确认当前库
USE shop;
SELECT DATABASE();

-- 修改字符集（只改默认值，已存在的表不受影响，需逐表 ALTER）
ALTER DATABASE shop CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 删除（高危：不可恢复，务必先备份）
DROP DATABASE shop;
```

## 9. 数据类型速查

| 场景 | 推荐类型 | 说明 |
| --- | --- | --- |
| 自增主键 | `BIGINT UNSIGNED AUTO_INCREMENT` | 避免 `INT` 用尽；分布式场景考虑雪花 ID/有序 UUID |
| 字符串主键 | `CHAR(36)` / `BINARY(16)` | UUID 用 `BINARY(16)` 存储省空间、索引更小 |
| 金额 | `DECIMAL(18,4)` | **禁止用 FLOAT/DOUBLE**（二进制浮点误差） |
| 短文本 | `VARCHAR(n)` | n 按真实上限；utf8mb4 下 1 字符 ≤ 4 字节 |
| 长文本/日志 | `TEXT` / `LONGTEXT` | 不能整体索引，需前缀索引或全文索引 |
| 枚举状态 | `TINYINT UNSIGNED`（+ 字典表） | `ENUM` 改动需 DDL，扩展性差 |
| 布尔 | `TINYINT(1)` | 或 `BIT(1)`；`BOOLEAN` 只是别名 |
| 时间点 | `DATETIME(3)` | 不随时区变化；需时区转换用 `TIMESTAMP` |
| 时间戳 | `TIMESTAMP` | 范围 1970~2038，存储为 UTC，随 `time_zone` 显示 |
| 日期 | `DATE` | 仅日期 |
| JSON | `JSON` | 8.0 原生类型，支持函数索引（生成列上的索引） |
| 二进制 | `VARBINARY` / `BLOB` | 大文件建议存对象存储，库里只存路径 |

> 时区建议：统一用 `DATETIME` 存"业务本地时间"或统一存 UTC，二选一并写进规范；`Ticket` 类系统别混用。

## 10. 建表、约束与索引

### 10.1 完整示例

```sql
CREATE TABLE `orders` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no`      VARCHAR(32)     NOT NULL COMMENT '业务单号',
  `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `amount`        DECIMAL(18,4)   NOT NULL DEFAULT 0.0000 COMMENT '订单金额',
  `status`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0待支付 1已支付 9取消',
  `remark`        VARCHAR(255)    NULL,
  `ext`           JSON            NULL COMMENT '扩展属性',
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_created` (`user_id`, `created_at`),
  KEY `idx_status_created` (`status`, `created_at`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='订单主表';
```

```sql
CREATE TABLE `order_item` (
  `id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`  BIGINT UNSIGNED NOT NULL,
  `sku`       VARCHAR(64)     NOT NULL,
  `qty`       INT UNSIGNED    NOT NULL DEFAULT 0,
  `price`     DECIMAL(18,4)   NOT NULL DEFAULT 0.0000,
  `line_amt`  DECIMAL(18,4)   GENERATED ALWAYS AS (`qty` * `price`) STORED COMMENT '生成列',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_sku` (`order_id`, `sku`),
  KEY `idx_sku` (`sku`),
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  COMMENT='订单明细';
```

### 10.2 约束类型

| 约束 | 语法 | 作用 |
| --- | --- | --- |
| 主键 | `PRIMARY KEY (col)` | 唯一 + 非空 + 聚簇索引 |
| 唯一 | `UNIQUE KEY uk (col)` | 唯一（允许多个 NULL） |
| 非空 | `NOT NULL` | 防脏数据，优于应用层校验 |
| 默认值 | `DEFAULT 0` | 避免 NULL 语义歧义 |
| 外键 | `FOREIGN KEY ... REFERENCES` | 保证引用完整性；高并发写入场景常改由应用保证 |
| 检查 | `CHECK (qty > 0)` | 8.0.16+ 真正生效 |
| 生成列 | `GENERATED ALWAYS AS (...) STORED/VIRTUAL` | 用于函数索引、冗余计算 |

### 10.3 索引设计要点

- 联合索引遵循**最左前缀**：`(a,b,c)` 可支持 `a`、`a,b`、`a,b,c`，不能单独支持 `b`。
- 排序/分组也可利用索引：`WHERE a=? ORDER BY b` 命中 `(a,b)` 时无需 filesort。
- 覆盖索引（`EXPLAIN` 的 `Extra` 出现 `Using index`）可避免回表。
- 高选择性列（区分度高）放前面；范围条件之后的列索引利用率会下降。
- 单表索引不宜过多（写放大、buffer pool 占用）；上线前用 `sys.schema_unused_indexes` 找无用索引。
- 现有索引是否冗余，先看 `information_schema.STATISTICS`，移除前确认外键、排序、覆盖需求。

```sql
SHOW INDEX FROM orders;
SELECT * FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='shop' AND TABLE_NAME='orders';
SELECT * FROM sys.schema_unused_indexes WHERE object_schema='shop';
SELECT * FROM sys.schema_redundant_indexes WHERE table_schema='shop';
```

## 11. 修改表结构（ALTER TABLE / DDL）

### 11.1 常用语法

```sql
-- 加列 / 删列
ALTER TABLE orders ADD COLUMN channel VARCHAR(16) NULL AFTER status;
ALTER TABLE orders DROP COLUMN channel;

-- 改类型（注意：可能触发重建 + 复制延迟）
ALTER TABLE orders MODIFY COLUMN remark VARCHAR(500) NULL;

-- 改名
ALTER TABLE orders RENAME COLUMN order_no TO biz_no, ALGORITHM=INPLACE;
RENAME TABLE orders TO orders_2026;                 -- 表改名（原子）

-- 索引
ALTER TABLE orders ADD INDEX idx_amount (amount);
ALTER TABLE orders ADD UNIQUE KEY uk_biz (biz_no);
ALTER TABLE orders DROP INDEX idx_amount;
ALTER TABLE orders ALTER INDEX idx_user_created INVISIBLE;   -- 8.0：先隐藏再决定删除

-- 默认值 / 注释
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 0;
ALTER TABLE orders COMMENT='订单主表 v2';

-- 改字符集/排序规则
ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

### 11.2 DDL 算法与锁（必须先看清代价）

```sql
-- 查看某次变更理论上可用的算法
ALTER TABLE orders ADD COLUMN c1 INT, ALGORITHM=INSTANT;   -- 仅改元数据，瞬间完成
ALTER TABLE orders ADD INDEX idx_x (amount), ALGORITHM=INPLACE, LOCK=NONE;  -- 在线加索引
```

| 算法 | 是否阻塞 DML | 代价 |
| --- | --- | --- |
| `INSTANT` | 否 | 只改数据字典，秒级；8.0.12+ 支持加列（位置受限） |
| `INPLACE` | 否（`LOCK=NONE`） | 需重建索引/表空间，占用额外磁盘与 I/O |
| `COPY` | **是** | 拷贝整表，最慢，风险最高 |

**大表变更的推荐做法（扩展—回填—切读—收缩）：**

1. 前置检查：表行数、磁盘余量（≥ 表大小 × 2）、当前复制延迟、是否有长事务。
2. 预演：在等规模副本或预发库跑一次，记录耗时与资源峰值。
3. 在线工具：`pt-online-schema-change` 或 `gh-ost`（需原表有主键/唯一索引），或采用应用层双写方案。
4. 分批回填：按主键范围切批，控制批次大小与 sleep，观察复制延迟。
5. 每个阶段设置停止阈值（如 `Seconds_Behind_Source > 10s` 立即暂停）。
6. 保留旧列/旧表一段时间，确认无误后再清理。

```sql
-- 查看/控制元数据锁等待（8.0）
SELECT * FROM performance_schema.metadata_locks WHERE OBJECT_SCHEMA='shop';
SELECT * FROM sys.schema_table_lock_waits;
SHOW PROCESSLIST;   -- 找长时间未提交的事务，避免 DDL 排队堵住全表请求
```

## 12. 删除表 / 清空表 / 复制表

```sql
DROP TABLE orders_2026;               -- 删表结构 + 数据，高危
TRUNCATE TABLE orders_2026;           -- 清空数据，DDL 操作，隐式提交，不可回滚
DELETE FROM orders_2026;              -- 逐行删除，可回滚，但大表极慢

-- TRUNCATE 与 DELETE 对比
-- TRUNCATE：不写 binlog 行记录（ROW 模式下语句级）、重置 AUTO_INCREMENT、释放表空间、
--           不能带 WHERE、不能触发触发器、隐式提交。
-- DELETE：  可带 WHERE、保留自增值、逐行写日志、可回滚、会触发触发器。

-- 复制表结构 / 结构与数据
CREATE TABLE orders_bak LIKE orders;                    -- 仅结构（含索引）
CREATE TABLE orders_bak2 AS SELECT * FROM orders;       -- 结构+数据（会丢索引和约束）
INSERT INTO orders_bak SELECT * FROM orders;            -- 复制数据
```

---

# 第三部分　数据增删改查（CRUD）

## 13. 插入（INSERT）

```sql
-- 单行
INSERT INTO orders (order_no, user_id, amount, status)
VALUES ('SO20260922001', 1001, 199.0000, 0);

-- 多行（比逐条插入快得多，注意 max_allowed_packet 与单事务大小）
INSERT INTO orders (order_no, user_id, amount, status) VALUES
  ('SO20260922002', 1002, 88.5000, 0),
  ('SO20260922003', 1003, 520.0000, 1);

-- 从查询结果插入
INSERT INTO orders_hist (order_no, user_id, amount)
SELECT order_no, user_id, amount FROM orders WHERE created_at < '2026-01-01';

-- 忽视冲突错误（唯一键冲突时跳过）
INSERT IGNORE INTO orders (order_no, user_id, amount) VALUES ('SO20260922001', 1001, 1.0);

-- 冲突时更新（常用 upsert）
INSERT INTO inventory (sku, qty) VALUES ('SKU-1', 10)
ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty);
-- 8.0.20+ 推荐新语法，避免 VALUES() 弃用警告：
-- ON DUPLICATE KEY UPDATE qty = qty + new.qty;   -- 需配合 AS new 别名（8.0.19+）

-- 替换（先删后插：会丢未指定列的旧值，慎用）
REPLACE INTO inventory (sku, qty) VALUES ('SKU-1', 10);
```

> `ON DUPLICATE KEY UPDATE` 在并发下会加锁更多，且自增值会跳号（属正常现象）。

## 14. 查询（SELECT）

### 14.1 完整子句写法顺序

```sql
SELECT   [DISTINCT] 列/表达式 [AS 别名]
FROM     表 [AS 别名]
JOIN     其他表 ON 连接条件
WHERE    行过滤条件
GROUP BY 分组列
HAVING   分组后过滤
WINDOW   命名窗口
ORDER BY 排序列 [ASC|DESC]
LIMIT    偏移量, 行数
FOR UPDATE / FOR SHARE            -- 加锁读取
```

**逻辑执行顺序**（理解"为什么 `WHERE` 里不能用 `SELECT` 别名"）：

```
FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT(含窗口函数) → DISTINCT → ORDER BY → LIMIT
```

### 14.2 基础查询

```sql
SELECT * FROM orders WHERE status = 0 LIMIT 10;

SELECT id, order_no, amount,
       amount * 1.06 AS amount_with_tax
FROM orders
WHERE created_at >= '2026-09-01 00:00:00'
  AND status IN (0, 1)
  AND user_id BETWEEN 1000 AND 2000
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### 14.3 各种条件写法

```sql
WHERE user_id = 1001
  AND status IN (0,1)                 -- 替代 OR
  AND amount BETWEEN 100 AND 500
  AND remark LIKE '急%'
  AND ext IS NOT NULL
  AND deleted_at IS NULL
  AND (channel = 'app' OR channel IS NULL);

-- NULL 不能与 = 比较
SELECT * FROM orders WHERE remark = NULL;      -- ❌ 永不为真
SELECT * FROM orders WHERE remark IS NULL;     -- ✅
SELECT * FROM orders WHERE remark <=> NULL;    -- ✅ NULL 安全等值（8.0）

-- 参数化查询（应用层必须做，防注入 + 复用执行计划）
SELECT * FROM orders WHERE user_id = ? AND status = ?;
```

### 14.4 连接（JOIN）

```sql
-- INNER JOIN：只返回匹配行
SELECT o.order_no, u.nickname, o.amount
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at >= '2026-09-01';

-- LEFT JOIN：保留左表全部行
SELECT u.id, u.nickname, COUNT(o.id) AS order_cnt
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.nickname;

-- 自连接：查每个用户最近一单
SELECT o1.user_id, o1.order_no, o1.created_at
FROM orders o1
JOIN (SELECT user_id, MAX(created_at) AS mx FROM orders GROUP BY user_id) o2
  ON o2.user_id = o1.user_id AND o2.mx = o1.created_at;
```

> JOIN 性能关键：**连接列必须有索引**，且两边类型/字符集/排序规则一致，否则会触发隐式转换导致索引失效。

### 14.5 子查询与 CTE（8.0+）

```sql
-- 标量子查询
SELECT order_no, amount,
       (SELECT nickname FROM users u WHERE u.id = o.user_id) AS nickname
FROM orders o;

-- IN / EXISTS
SELECT * FROM users u WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.amount > 1000
);

-- CTE：可读性优于嵌套子查询
WITH paid AS (
  SELECT * FROM orders WHERE status = 1 AND created_at >= '2026-09-01'
), agg AS (
  SELECT user_id, SUM(amount) AS total FROM paid GROUP BY user_id
)
SELECT u.nickname, a.total
FROM agg a JOIN users u ON u.id = a.user_id
ORDER BY a.total DESC
LIMIT 10;

-- 递归 CTE：树形结构
WITH RECURSIVE tree AS (
  SELECT id, parent_id, name, 0 AS lvl FROM category WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.parent_id, c.name, t.lvl + 1
  FROM category c JOIN tree t ON c.parent_id = t.id
)
SELECT * FROM tree ORDER BY lvl, id;
```

### 14.6 集合运算（8.0+）

```sql
SELECT user_id FROM orders_2025
UNION            -- 去重
SELECT user_id FROM orders_2026;

SELECT user_id FROM orders_2025
UNION ALL        -- 不去重，性能更好
SELECT user_id FROM orders_2026;

SELECT id FROM a INTERSECT SELECT id FROM b;   -- 8.0.31+
SELECT id FROM a EXCEPT    SELECT id FROM b;   -- 8.0.31+
```

### 14.7 结果限制与去重

```sql
SELECT DISTINCT status FROM orders;
SELECT * FROM orders ORDER BY id DESC LIMIT 10;
SELECT * FROM orders ORDER BY id LIMIT 100, 20;    -- 从第 100 行起取 20 行
```

> 深分页（`LIMIT 100000, 20`）会扫描并丢弃大量行，改用"游标法"：`WHERE id > 上次最大id ORDER BY id LIMIT 20`。

## 15. 更新（UPDATE）

```sql
-- 标准写法（务必先用 SELECT 核对范围）
SELECT COUNT(*) FROM orders WHERE status = 0 AND created_at < '2026-01-01';

UPDATE orders
SET status = 9, updated_at = NOW(3)
WHERE status = 0 AND created_at < '2026-01-01';

-- 多表关联更新
UPDATE orders o
JOIN users u ON u.id = o.user_id
SET o.remark = CONCAT(o.remark, ' [VIP]')
WHERE u.level >= 3;

-- 带排序与限制（单表）
UPDATE inventory SET qty = qty - 1 WHERE sku = 'SKU-1' AND qty > 0 ORDER BY id LIMIT 1;
```

**大批量更新/删除的分批模板：**

```sql
-- 每批 1000 行，按主键推进；循环执行直到 affected rows = 0
UPDATE orders
SET status = 9
WHERE id > :last_id AND status = 0
ORDER BY id
LIMIT 1000;
```

外部脚本循环要点：单批耗时、`Seconds_Behind_Source`、锁等待、磁盘增长都要监控；设停止阈值（如复制延迟 > 10s 暂停）。

## 16. 删除（DELETE）

```sql
SELECT COUNT(*) FROM orders WHERE status = 9 AND created_at < '2025-01-01';

DELETE FROM orders
WHERE status = 9 AND created_at < '2025-01-01'
ORDER BY id LIMIT 1000;      -- 分批删，降低 binlog 与锁压力

-- 全表清空优先用 TRUNCATE（快、释放空间），但要确认不需要回滚与触发器
```

> `DELETE` 不释放磁盘空间（只标记可复用），大量删除后需 `OPTIMIZE TABLE`（会重建表，生产慎用）或按分区 `DROP PARTITION`。

## 17. 事务

```sql
START TRANSACTION;              -- 或 BEGIN
-- 8.0 可加一致性快照：START TRANSACTION WITH CONSISTENT SNAPSHOT;

UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;

SAVEPOINT sp1;                  -- 设置保存点
-- ... 可能失败的逻辑
ROLLBACK TO SAVEPOINT sp1;      -- 回滚到保存点

COMMIT;                         -- 提交
-- ROLLBACK;                    -- 整体回滚
```

### 17.1 隔离级别与锁

```sql
SELECT @@transaction_isolation;                        -- 默认 REPEATABLE-READ
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 加锁读取
SELECT * FROM inventory WHERE sku = 'SKU-1' FOR UPDATE;   -- 排他锁（悲观锁）
SELECT * FROM inventory WHERE sku = 'SKU-1' FOR SHARE;    -- 共享锁
SELECT * FROM inventory WHERE sku = 'SKU-1' FOR UPDATE NOWAIT;      -- 8.0：拿不到锁立即报错
SELECT * FROM inventory WHERE sku = 'SKU-1' FOR UPDATE SKIP LOCKED; -- 8.0：跳过被锁行（任务队列）
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED | 否 | 可能 | 可能 |
| REPEATABLE READ（默认） | 否 | 否 | InnoDB 通过间隙锁基本避免 |
| SERIALIZABLE | 否 | 否 | 否 |

### 17.2 死锁与锁等待

```sql
SHOW ENGINE INNODB STATUS\G          -- 查看 LATEST DETECTED DEADLOCK 段
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
SELECT * FROM sys.innodb_lock_waits; -- 直观显示谁在等谁
SELECT @@innodb_lock_wait_timeout;   -- 默认 50 秒
```

处理原则：

1. **死锁是并发事务的正常结果之一**，不是 Bug；应用必须捕获 `1213` 并**重试整个事务**（不是只重发最后一条语句）。
2. 缩短事务、按固定顺序访问表/行、给 WHERE 条件建合适索引（否则会扩大锁定范围）。
3. 必要时用 `innodb_deadlock_detect=ON`（默认）让服务器快速检测并回滚代价小的事务。
4. 不要第一反应就 `KILL` 会话或重启实例，先留证据（`SHOW ENGINE INNODB STATUS`）。

```sql
SHOW PROCESSLIST;
SELECT * FROM information_schema.INNODB_TRX;
KILL <thread_id>;   -- 仅在定位清楚、且确认可中断时使用
```

---

# 第四部分　字符串操作指令

## 18. 字符串函数总览

| 函数 | 作用 | 示例 | 结果 |
| --- | --- | --- | --- |
| `CONCAT(a,b,...)` | 拼接，任一为 NULL 则整体 NULL | `CONCAT('a','-','b')` | `a-b` |
| `CONCAT_WS(sep,a,b)` | 带分隔符拼接，**忽略 NULL** | `CONCAT_WS('-','a',NULL,'b')` | `a-b` |
| `LENGTH(s)` | 字节数 | `LENGTH('中文')` | `6` |
| `CHAR_LENGTH(s)` | 字符数 | `CHAR_LENGTH('中文')` | `2` |
| `SUBSTRING(s,p,l)` / `SUBSTR` / `MID` | 截取（位置从 1 开始，支持负数） | `SUBSTRING('abcdef',2,3)` | `bcd` |
| `SUBSTRING_INDEX(s,delim,n)` | 按分隔符取第 n 段（支持负数） | `SUBSTRING_INDEX('a.b.c','.',-1)` | `c` |
| `LEFT(s,n)` / `RIGHT(s,n)` | 左右截取 | `LEFT('abcdef',3)` | `abc` |
| `LOCATE(sub,s[,pos])` / `INSTR(s,sub)` / `POSITION(sub IN s)` | 查找位置，找不到为 0 | `LOCATE('c','abcdef')` | `3` |
| `REPLACE(s,from,to)` | 全局替换 | `REPLACE('a-b-c','-','+')` | `a+b+c` |
| `TRIM(s)` / `LTRIM` / `RTRIM` | 去空白 | `TRIM('  x  ')` | `x` |
| `TRIM(LEADING '0' FROM s)` | 去指定字符 | `TRIM(LEADING '0' FROM '007')` | `7` |
| `LPAD(s,n,p)` / `RPAD` | 左右填充 | `LPAD('7',3,'0')` | `007` |
| `UPPER`/`LOWER`/`UCASE`/`LCASE` | 大小写转换 | `UPPER('ab')` | `AB` |
| `REVERSE(s)` | 反转 | `REVERSE('abc')` | `cba` |
| `REPEAT(s,n)` / `SPACE(n)` | 重复 / 空格 | `REPEAT('ab',2)` | `abab` |
| `INSERT(s,pos,len,new)` | 指定位置替换 | `INSERT('abcdef',2,3,'X')` | `aXef` |
| `FIELD(v,a,b,...)` | 值在列表中的位置 | `FIELD('b','a','b','c')` | `2` |
| `FIND_IN_SET(v,list)` | 逗号列表中的位置 | `FIND_IN_SET('b','a,b,c')` | `2` |
| `ELT(n,a,b,...)` | 取第 n 个 | `ELT(2,'a','b','c')` | `b` |
| `STRCMP(a,b)` | 比较，返回 -1/0/1 | `STRCMP('a','b')` | `-1` |
| `ASCII(c)` / `CHAR(n)` | 字符 ↔ 码值 | `ASCII('A')` | `65` |
| `HEX(x)` / `UNHEX(h)` | 十六进制互转 | `HEX('A')` | `41` |
| `BIN(n)` / `OCT(n)` / `CONV(n,from,to)` | 进制转换 | `CONV('ff',16,10)` | `255` |
| `FORMAT(n,d)` | 千分位格式化 | `FORMAT(1234567.891,2)` | `1,234,567.89` |
| `QUOTE(s)` | 转义为合法 SQL 字面量 | `QUOTE("a'b")` | `'a\'b'` |
| `SOUNDEX(s)` | 读音近似（英文） | `SOUNDEX('Smith')` | `S530` |

## 19. 字符串拼接

```sql
-- 基本拼接
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users;

-- 拼接时处理 NULL（否则整串变 NULL）
SELECT CONCAT(IFNULL(remark, ''), ' [系统]') FROM orders;
SELECT CONCAT_WS(' / ', province, city, district) AS addr FROM address;

-- 数值参与拼接会自动转字符串
SELECT CONCAT('订单号: ', id, '，金额: ', amount) FROM orders;

-- GROUP_CONCAT：分组内拼接（默认逗号，受 group_concat_max_len 限制）
SELECT user_id, GROUP_CONCAT(order_no ORDER BY created_at DESC SEPARATOR ',') AS order_list
FROM orders GROUP BY user_id;

SET SESSION group_concat_max_len = 10240;    -- 需要长结果时先调大
```

> 注意：`||` 在 MySQL 默认是**逻辑或**，只有开了 `PIPES_AS_CONCAT` 才是拼接，建议一律使用 `CONCAT` / `CONCAT_WS`。

## 20. 模糊查询（LIKE / REGEXP / 全文索引）

### 20.1 LIKE

```sql
-- % 匹配任意多字符，_ 匹配单个字符
SELECT * FROM users WHERE nickname LIKE '张%';        -- 可用索引（前缀匹配）
SELECT * FROM users WHERE nickname LIKE '%明%';       -- ❌ 无法用索引，全表扫描
SELECT * FROM users WHERE phone LIKE '138%';          -- ✅ 可用索引

-- 转义通配符（查含 % 或 _ 的字面量）
SELECT * FROM coupon WHERE code LIKE 'AB\_%' ESCAPE '\\';

-- 反例：别对列做函数运算，会导致索引失效
SELECT * FROM users WHERE DATE(created_at) = '2026-09-01';        -- ❌
SELECT * FROM users WHERE created_at >= '2026-09-01 00:00:00'
                      AND created_at <  '2026-09-02 00:00:00';    -- ✅
```

**前导通配符的替代方案：**

1. 反向存储列（如 `nickname_rev`）+ `LIKE '明%'`。
2. 外置检索引擎（Elasticsearch / OpenSearch）。
3. 全文索引（见 20.3）。

### 20.2 正则（REGEXP）

```sql
SELECT * FROM users WHERE email REGEXP '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
SELECT * FROM logs WHERE msg REGEXP 'timeout|refused';
SELECT REGEXP_REPLACE(phone, '[^0-9]', '') AS digits FROM users;     -- 8.0
SELECT REGEXP_SUBSTR('order-SO123-X', '[A-Z]{2}[0-9]+') AS code;     -- 8.0
SELECT REGEXP_INSTR('abc123', '[0-9]+') AS pos;                      -- 8.0
SELECT REGEXP_LIKE('abc123', '^[a-z]+[0-9]+$');                      -- 8.0
```

> 8.0 起正则引擎为 ICU，语法接近 PCRE 但与 POSIX 有差异。**跨版本兼容建议用字符类**（`[0-9]`、`[A-Za-z]`）而不是 `\d`、`\w`。正则一律无法使用普通索引。

### 20.3 全文索引（LIKE 的性能替代）

```sql
ALTER TABLE article ADD FULLTEXT KEY ft_title_body (title, body);

-- 自然语言模式
SELECT id, title, MATCH(title, body) AGAINST ('数据库 优化' ) AS score
FROM article
WHERE MATCH(title, body) AGAINST ('数据库 优化')
ORDER BY score DESC;

-- 布尔模式：+必须包含 -排除 "短语" *前缀
SELECT * FROM article
WHERE MATCH(title, body) AGAINST ('+MySQL -Oracle "性能优化"*' IN BOOLEAN MODE);
```

要点：`innodb_ft_min_token_size` 默认 3，**中文分词支持有限**（需 ngram 解析器：`WITH PARSER ngram`）；全文索引是独立辅助表，写入有成本。

## 21. 字符串清洗与脱敏

```sql
-- 手机号脱敏
SELECT CONCAT(LEFT(phone,3), '****', RIGHT(phone,4)) AS phone_mask FROM users;

-- 邮箱脱敏
SELECT CONCAT(LEFT(email,1), '***@', SUBSTRING_INDEX(email,'@',-1)) FROM users;

-- 统一大小写、去空格
UPDATE users SET email = LOWER(TRIM(email));

-- 取文件名/扩展名
SELECT SUBSTRING_INDEX('/var/log/app.log', '/', -1);          -- app.log
SELECT SUBSTRING_INDEX('app.tar.gz', '.', -1);                 -- gz

-- 段落转多行（8.0 递归 CTE 简例）
SELECT id, TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ',', n.n), ',', -1)) AS tag
FROM users
JOIN (SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) n
WHERE n.n <= 1 + CHAR_LENGTH(tags) - CHAR_LENGTH(REPLACE(tags, ',', ''));
```

---

# 第五部分　统计与聚合

## 22. 聚合函数

| 函数 | 说明 | 关键点 |
| --- | --- | --- |
| `COUNT(*)` | 行数 | 统计所有行，推荐 |
| `COUNT(1)` | 行数 | 与 `COUNT(*)` 等价，性能相同 |
| `COUNT(col)` | 非 NULL 行数 | **NULL 不计入** |
| `COUNT(DISTINCT col)` | 去重计数 | 大表消耗大 |
| `SUM(col)` | 求和 | NULL 忽略；全 NULL 返回 NULL |
| `AVG(col)` | 平均 | 除以非 NULL 行数，注意与 `SUM/COUNT(*)` 差异 |
| `MIN/MAX(col)` | 最值 | 有索引时可能走索引优化 |
| `STD/STDDEV/VARIANCE` | 标准差/方差 | — |
| `BIT_AND/BIT_OR/BIT_XOR` | 位运算聚合 | 权限位场景 |
| `GROUP_CONCAT` | 组内字符串拼接 | 受 `group_concat_max_len` 限制 |
| `JSON_ARRAYAGG` / `JSON_OBJECTAGG` | 组内聚合为 JSON | 8.0+ |
| `STDDEV_SAMP/POP` | 样本/总体标准差 | — |

```sql
SELECT
  COUNT(*)                       AS total_rows,
  COUNT(remark)                  AS not_null_remark,
  COUNT(DISTINCT user_id)        AS user_cnt,
  SUM(amount)                    AS total_amt,
  AVG(amount)                    AS avg_amt,
  MIN(amount)                    AS min_amt,
  MAX(amount)                    AS max_amt,
  STDDEV(amount)                 AS std_amt
FROM orders
WHERE created_at >= '2026-09-01' AND created_at < '2026-10-01';
```

## 23. 分组（GROUP BY）与分组后过滤（HAVING）

```sql
-- 按用户统计订单数与金额
SELECT user_id,
       COUNT(*)      AS order_cnt,
       SUM(amount)   AS total_amt,
       AVG(amount)   AS avg_amt,
       MAX(created_at) AS last_order_at
FROM orders
WHERE status <> 9                     -- 先过滤明细（能用索引）
GROUP BY user_id
HAVING SUM(amount) > 10000            -- 再过滤分组结果
ORDER BY total_amt DESC
LIMIT 10;
```

```sql
-- 多列分组
SELECT DATE(created_at) AS d, status, COUNT(*) AS cnt
FROM orders
GROUP BY d, status
ORDER BY d DESC, status;

-- 按表达式/别名分组（8.0 允许按别名）
SELECT YEAR(created_at) AS y, COUNT(*) FROM orders GROUP BY y;

-- 分组列加索引可以避免临时表与 filesort
```

### 23.1 `ONLY_FULL_GROUP_BY`（8.0 默认开启）

```sql
-- ❌ 报错：nickname 不在 GROUP BY 中且非聚合列
SELECT user_id, nickname, COUNT(*) FROM orders GROUP BY user_id;

-- ✅ 方案一：把列加入 GROUP BY
SELECT user_id, nickname, COUNT(*) FROM orders GROUP BY user_id, nickname;

-- ✅ 方案二：用 ANY_VALUE() 显式表达"取任意值"
SELECT user_id, ANY_VALUE(nickname), COUNT(*) FROM orders GROUP BY user_id;

-- ✅ 方案三：先聚合再 JOIN 维表（推荐，语义最清晰）
SELECT a.user_id, u.nickname, a.cnt
FROM (SELECT user_id, COUNT(*) cnt FROM orders GROUP BY user_id) a
JOIN users u ON u.id = a.user_id;
```

> 不建议为了"能跑"而关闭 `ONLY_FULL_GROUP_BY`：它保护的是结果正确性。

### 23.2 小计与总计：`WITH ROLLUP`

```sql
SELECT IFNULL(status,'总计') AS status, COUNT(*) AS cnt, SUM(amount) AS amt
FROM orders
GROUP BY status WITH ROLLUP;

-- 8.0：用 GROUPING() 精确区分"真实的 NULL"和"ROLLUP 生成的 NULL"
SELECT status, GROUPING(status) AS is_total, COUNT(*) AS cnt
FROM orders
GROUP BY status WITH ROLLUP;
```

### 23.3 条件统计（一次扫描得到多指标）

```sql
SELECT
  COUNT(*)                                                    AS total,
  SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END)                 AS unpaid,
  SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END)                 AS paid,
  SUM(CASE WHEN status = 1 THEN amount ELSE 0 END)            AS paid_amt,
  ROUND(100 * SUM(status = 1) / COUNT(*), 2)                  AS paid_rate
FROM orders
WHERE created_at >= '2026-09-01';
```

### 23.4 分组取最新/TOP N

```sql
-- 每个用户最近一单（窗口函数，8.0+）
SELECT * FROM (
  SELECT id, user_id, order_no, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  FROM orders
) t WHERE rn = 1;

-- 每个用户金额 Top3
SELECT * FROM (
  SELECT user_id, order_no, amount,
         DENSE_RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rk
  FROM orders
) t WHERE rk <= 3;
```

### 23.5 常用统计模式

```sql
-- 日活 / 日订单趋势
SELECT DATE(created_at) AS d, COUNT(*) AS cnt, COUNT(DISTINCT user_id) AS uv
FROM orders
WHERE created_at >= CURDATE() - INTERVAL 30 DAY
GROUP BY d ORDER BY d;

-- 留存/复购（同一用户多单）
SELECT user_id, COUNT(*) AS cnt
FROM orders GROUP BY user_id HAVING COUNT(*) > 1;

-- 环比（窗口函数 LAG）
SELECT d, amt, LAG(amt) OVER (ORDER BY d) AS prev_amt,
       ROUND(100 * (amt - LAG(amt) OVER (ORDER BY d)) / NULLIF(LAG(amt) OVER (ORDER BY d), 0), 2) AS growth_pct
FROM (SELECT DATE(created_at) d, SUM(amount) amt FROM orders GROUP BY d) t;

-- 中位数/分位数（8.0 无内置函数，用排序 + 位置近似）
SELECT AVG(amount) AS approx_median FROM (
  SELECT amount,
         ROW_NUMBER() OVER (ORDER BY amount) AS rn,
         COUNT(*) OVER ()                    AS cnt
  FROM orders
) t WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```

## 24. 窗口函数速查（8.0+）

| 函数 | 说明 |
| --- | --- |
| `ROW_NUMBER() OVER (PARTITION BY a ORDER BY b)` | 组内连续序号（无并列） |
| `RANK()` | 并列跳号（1,1,3） |
| `DENSE_RANK()` | 并列不跳号（1,1,2） |
| `NTILE(n)` | 分 n 桶 |
| `LAG(col, n, default)` / `LEAD(...)` | 取前/后第 n 行 |
| `FIRST_VALUE` / `LAST_VALUE` / `NTH_VALUE` | 组内取指定行 |
| `SUM/AVG/COUNT/MIN/MAX(...) OVER (...)` | 累计/滑动聚合 |
| `PERCENT_RANK()` / `CUME_DIST()` | 百分位排名/累积分布 |

```sql
SELECT id, user_id, amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_amt,
       ROUND(100 * amount / SUM(amount) OVER (PARTITION BY user_id), 2)     AS pct_of_user
FROM orders;

-- 注意 LAST_VALUE 默认窗口到当前行，取组内最后一行需显式指定框架
SELECT id, LAST_VALUE(order_no) OVER (
         PARTITION BY user_id ORDER BY created_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_order_no
FROM orders;
```

---

# 第六部分　其他高频函数

## 25. 日期时间函数

```sql
SELECT NOW(3), CURDATE(), CURTIME(), UTC_TIMESTAMP();
SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');          -- 格式化输出
SELECT DATE_FORMAT(NOW(), '%Y-%m-01') AS month_first;
SELECT STR_TO_DATE('2026-09-22 10:00:00', '%Y-%m-%d %H:%i:%s');

SELECT DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 1 MONTH);
SELECT DATE_ADD(CURDATE(), INTERVAL -DAY(CURDATE()) + 1 DAY);  -- 本月 1 号

SELECT DATEDIFF('2026-09-30','2026-09-01');               -- 相差天数
SELECT TIMESTAMPDIFF(HOUR, created_at, NOW()) FROM orders; -- 相差小时
SELECT TIMESTAMPDIFF(MINUTE, '2026-09-01 08:00:00', '2026-09-01 10:30:00');

SELECT EXTRACT(YEAR FROM NOW()), YEAR(NOW()), MONTH(NOW()), DAY(NOW());
SELECT LAST_DAY(NOW());                                   -- 当月最后一天
SELECT WEEKDAY(NOW()), DAYOFWEEK(NOW());                  -- 0=周一 / 1=周日
SELECT UNIX_TIMESTAMP(), FROM_UNIXTIME(1790000000);
SELECT CONVERT_TZ('2026-09-22 10:00:00','+08:00','+00:00');
SELECT DATE_TRUNC('MONTH', NOW());                        -- 8.0
SELECT PERIOD_ADD(202608, 1), PERIOD_DIFF(202610, 202608);
```

> **时区陷阱**：`NOW()` 返回会话时区时间，`UTC_TIMESTAMP()` 返回 UTC。跨时区系统建议统一存 UTC，展示层再做转换，并显式设置 `time_zone`。

## 26. 数值函数

```sql
SELECT ROUND(3.456, 2), TRUNCATE(3.456, 2), CEIL(3.1), FLOOR(3.9);
SELECT ABS(-3), MOD(10,3), POW(2,10), SQRT(16);
SELECT GREATEST(1,5,3), LEAST(1,5,3);
SELECT RAND(), FLOOR(RAND() * 100);                       -- 随机数
SELECT FORMAT(1234567.891, 2);                            -- 千分位
SELECT 7 DIV 2, 7 % 2;                                    -- 整除 / 取模
```

## 27. NULL 与条件函数

```sql
SELECT IFNULL(remark, '无')                  FROM orders;   -- 两参数
SELECT COALESCE(remark, note, '无')          FROM orders;   -- 取第一个非 NULL
SELECT NULLIF(status, 0)                     FROM orders;   -- 相等则返回 NULL
SELECT IF(status = 1, '已支付', '未支付')      FROM orders;

SELECT CASE status
         WHEN 0 THEN '待支付'
         WHEN 1 THEN '已支付'
         WHEN 9 THEN '已取消'
         ELSE '未知' END AS status_desc
FROM orders;

SELECT CASE WHEN amount > 1000 THEN '大额'
            WHEN amount > 100  THEN '中额'
            ELSE '小额' END AS tier
FROM orders;
```

## 28. 类型转换与 JSON

```sql
SELECT CAST('123' AS UNSIGNED), CAST(123 AS CHAR), CAST('2026-09-22' AS DATE);
SELECT CONVERT('123', SIGNED), CONVERT('abc' USING utf8mb4);
SELECT BINARY 'abc' = 'ABC';                       -- 二进制比较（区分大小写）

-- JSON
SELECT JSON_OBJECT('id', id, 'amt', amount) FROM orders;
SELECT JSON_EXTRACT(ext, '$.channel'), ext->'$.channel', ext->>'$.channel' FROM orders;
SELECT JSON_UNQUOTE(JSON_EXTRACT(ext,'$.channel')) FROM orders;
SELECT JSON_SET(ext, '$.vip', true), JSON_REMOVE(ext, '$.tmp') FROM orders;
SELECT JSON_CONTAINS(ext, '"app"', '$.channel') FROM orders;
SELECT JSON_VALID('{"a":1}'), JSON_LENGTH('[1,2,3]'), JSON_KEYS('{"a":1,"b":2}');
SELECT JSON_VALUE(ext, '$.channel' RETURNING CHAR(16)) FROM orders;   -- 8.0.21+
SELECT jt.* FROM orders, JSON_TABLE(ext, '$'
         COLUMNS(channel VARCHAR(16) PATH '$.channel', vip TINYINT PATH '$.vip')) AS jt;
```

> JSON 列无法直接建普通索引；需要索引时用**生成列 + 索引**：
> `ALTER TABLE orders ADD COLUMN channel VARCHAR(16) GENERATED ALWAYS AS (JSON_UNQUOTE(ext->'$.channel')) STORED, ADD KEY idx_channel(channel);`

---

# 第七部分　运维、备份与诊断

## 29. 数据导入导出

```bash
# 导出：结构与数据（生产必备参数）
mysqldump -h 127.0.0.1 -u backup -p \
  --single-transaction \        # InnoDB 一致性快照，不锁表
  --source-data=2 \             # 记录 binlog 位点（8.0.26+ 新名，旧名为 --master-data）
  --set-gtid-purged=OFF \       # 视恢复策略决定，用于搭建从库时应为 ON
  --routines --triggers --events \
  --hex-blob --default-character-set=utf8mb4 \
  shop > /backup/shop_$(date +%F).sql

# 只导结构 / 只导数据 / 只导某些表
mysqldump -u backup -p --no-data   shop > shop_schema.sql
mysqldump -u backup -p --no-create-info shop > shop_data.sql
mysqldump -u backup -p shop orders order_item > two_tables.sql

# 导入
mysql -h 127.0.0.1 -u app -p shop < /backup/shop_2026-09-22.sql

# 服务端导出/导入（速度快，但要求 secure_file_priv 与 FILE 权限）
SELECT * FROM orders INTO OUTFILE '/data/out/orders.csv'
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' LINES TERMINATED BY '\n';

LOAD DATA LOCAL INFILE '/data/out/orders.csv' INTO TABLE orders
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
  LINES TERMINATED BY '\n' IGNORE 1 LINES;
```

> 8.0+ 已弃用 `mysqlpump`；大批量迁移建议用 **MySQL Shell `util.dumpInstance()` / `util.loadDump()`**（并行、压缩、可校验）。

```bash
mysqlsh -- util dumpInstance /backup/dump --threads=8 --compression=zstd
mysqlsh -- util loadDump /backup/dump --threads=8
mysqlsh -- util checkForServerUpgrade --target-version=8.4.0
```

## 30. 备份与恢复（以可恢复为准）

### 30.1 备份类型

| 类型 | 工具 | 特点 |
| --- | --- | --- |
| 逻辑全量 | `mysqldump` / MySQL Shell dump | 通用、可读、跨版本；大库慢 |
| 物理全量 | XtraBackup / Clone Plugin / 存储快照 | 快、适合大库；需匹配版本 |
| 增量 | XtraBackup `--incremental` / binlog | 缩短备份窗口 |
| 时间点恢复 | 全量基线 + binlog | 满足 RPO 分钟级 |

```sql
-- 8.0.17+ 内置克隆插件（搭建/重建节点快）
INSTALL PLUGIN clone SONAME 'mysql_clone.so';
CLONE LOCAL DATA DIRECTORY = '/data/clone/';
```

### 30.2 基于 binlog 的时间点恢复（PITR）

```bash
# 1) 查看当前日志与位点（8.2+ 推荐新语法；旧版为 SHOW MASTER STATUS）
SHOW BINARY LOG STATUS;
SHOW BINARY LOGS;
SHOW BINLOG EVENTS IN 'mysql-bin.000123' LIMIT 10;

# 2) 恢复全量基线
mysql -u root -p < /backup/full_2026-09-22.sql

# 3) 回放 binlog 到指定时间点（排除误操作那一秒）
mysqlbinlog --start-datetime='2026-09-22 09:00:00' \
            --stop-datetime='2026-09-22 10:15:00' \
            /data/mysql/binlog/mysql-bin.000123 | mysql -u root -p

# 4) 也可用 GTID 定位
mysqlbinlog --include-gtids='<uuid>:1-5000' /data/mysql/binlog/mysql-bin.000123 | mysql -u root -p
```

**PITR 成立的三个前提**（缺一不可）：

1. 一份**可用**的基线备份（且验证过能恢复）。
2. 从基线时间点到目标时间点**连续完整**的 binlog（未被 `PURGE` 掉）。
3. 明确的目标时间/GTID 边界与时区一致。

**恢复演练必做**：在隔离环境恢复，验证表行数、约束、关键业务查询、账号权限、复制重建。**备份任务成功 ≠ 可以恢复**。

## 31. 性能诊断

### 31.1 执行计划

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 1001 ORDER BY created_at DESC LIMIT 10;
EXPLAIN FORMAT=TREE SELECT ...;
EXPLAIN ANALYZE SELECT ...;      -- 8.0.18+，会真实执行，注意副作用！
EXPLAIN FOR CONNECTION <id>;     -- 查看正在跑的语句的计划
```

`EXPLAIN` 关键列解读：

| 列 | 关注点 |
| --- | --- |
| `type` | `system > const > eq_ref > ref > range > index > ALL`，出现 `ALL` 要警惕 |
| `key` / `possible_keys` | 实际用了哪个索引；为空=没走索引 |
| `rows` | 预估扫描行数（与 `EXPLAIN ANALYZE` 实际行数偏差大 ⇒ 统计信息问题） |
| `filtered` | 条件过滤后剩余比例 |
| `Extra` | `Using index`（覆盖索引，好）、`Using temporary`/`Using filesort`（注意）、`Using where`、`Using join buffer` |

### 31.2 慢日志与统计视图

```sql
SHOW VARIABLES LIKE 'slow_query_log%';
SHOW VARIABLES LIKE 'long_query_time';
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;   -- 若输出到表

-- 汇总最耗资源的语句模板（sys）
SELECT query, exec_count, total_latency, avg_latency, rows_examined_avg, full_scan
FROM sys.statement_analysis
ORDER BY total_latency DESC LIMIT 20;

-- 未使用索引的表与冗余索引
SELECT * FROM sys.schema_tables_with_full_table_scans LIMIT 20;
SELECT * FROM sys.schema_unused_indexes;
SELECT * FROM sys.schema_redundant_indexes;

-- 等待与 I/O
SELECT * FROM sys.innodb_lock_waits;
SELECT * FROM sys.io_global_by_wait_by_latency LIMIT 20;
SELECT * FROM sys.session;                  -- 当前会话概览（含执行的 SQL）

-- Performance Schema 原始视图
SELECT DIGEST_TEXT, COUNT_STAR, SUM_TIMER_WAIT/1e12 AS sec, SUM_ROWS_EXAMINED
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC LIMIT 20;
```

```bash
mysqldumpslow -s t -t 20 /data/mysql/slow.log        # 自带工具
pt-query-digest /data/mysql/slow.log                 # Percona 工具，报告更详细
```

### 31.3 参数与容量类指标

```sql
SHOW GLOBAL STATUS LIKE 'Innodb_buffer_pool_read%';    -- 命中率
SHOW GLOBAL STATUS LIKE 'Innodb_row_lock%';            -- 行锁等待
SHOW GLOBAL STATUS LIKE 'Created_tmp%';                -- 临时表
SHOW GLOBAL STATUS LIKE 'Threads_%';
SHOW GLOBAL STATUS LIKE 'Bytes_%';
SHOW ENGINE INNODB STATUS\G                            -- 综合诊断（锁、事务、I/O、redo）
SELECT * FROM information_schema.INNODB_TRX;           -- 长事务
```

> 调优结论必须建立在**同一数据、同一负载、前后对比**之上：分位延迟、扫描行数、锁等待、CPU/I/O。单次测试不能外推。

## 32. 复制与高可用概览

```sql
-- 从库配置（8.0.23+ 新语法）
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST      = '10.0.1.11',
  SOURCE_PORT      = 3306,
  SOURCE_USER      = 'repl',
  SOURCE_PASSWORD  = '<强密码>',
  SOURCE_AUTO_POSITION = 1;             -- GTID 自动定位

START REPLICA;
SHOW REPLICA STATUS\G                   -- 关注 Replica_IO_Running / Replica_SQL_Running / Seconds_Behind_Source
STOP REPLICA;
SELECT * FROM performance_schema.replication_applier_status_by_worker;   -- 并行回放进度
```

要点：

- 复制"运行中"不等于数据一致：需核对延迟、错误日志、GTID 位点，必要时做一致性校验（pt-table-checksum）。
- 半同步复制（`rpl_semi_sync_source_enabled`）可降低丢失风险，但会增加写延迟，需评估。
- 切换流程：冻结/协调写入 → 确认候选节点已追平 → 提升 → 隔离旧主（防脑裂）→ 更新写入口 → 校验复制重建与应用连接池。
- 读写分离必须定义 **read-after-write** 一致性策略（写后读走主库或有延迟回退）。
- MySQL InnoDB Cluster（MySQL Shell + Router）可提供自动故障转移，适合中等规模；更大规模需自研或使用云托管高可用方案。

## 33. 安全要点

- **最小权限**：应用账号只给必需 DML；DDL 归 DBA；`'%'` 主机名在生产禁用。
- **传输加密**：`require_secure_transport=ON`；`CREATE USER ... REQUIRE SSL`。
- **静态加密**：表空间加密（`ENCRYPTION='Y'`）、备份加密。
- **口令强度**：启用 `validate_password` 组件，禁止弱口令与长期不轮换。
- **审计**：企业版审计插件 / Percona Audit Log；至少记录 DDL 与高危 DML。
- **敏感数据**：导出文件、慢日志、备份、监控采样都可能含敏感数据，需加密与访问控制。
- **变更管理**：DDL 走审批，脚本进版本库，生产执行留痕；账号密码走密管系统，不进代码和命令行。

---

# 第八部分　附录

## 34. 常用命令速查

```sql
-- 元数据
SHOW DATABASES; SHOW TABLES; SHOW TABLES LIKE 'order%';
SHOW CREATE TABLE orders\G
SHOW TABLE STATUS LIKE 'orders'\G          -- 行数估算、数据/索引大小
SHOW FULL COLUMNS FROM orders;
SHOW INDEX FROM orders;
SHOW VARIABLES LIKE '%pattern%';
SHOW GLOBAL STATUS LIKE '%pattern%';
SELECT * FROM information_schema.TABLES
 WHERE TABLE_SCHEMA='shop' AND TABLE_NAME='orders';
SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='shop' AND TABLE_NAME='orders';
SELECT ROUTINE_NAME, ROUTINE_TYPE FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA='shop';
SHOW TRIGGERS FROM shop;
SHOW EVENTS FROM shop;
SHOW PROCESSLIST; SELECT * FROM information_schema.PROCESSLIST WHERE COMMAND <> 'Sleep';
SHOW WARNINGS; SHOW ERRORS;                -- 上一条语句的告警/错误
SHOW ENGINE INNODB STATUS\G
SHOW GRANTS FOR CURRENT_USER();
```

```sql
-- 维护
ANALYZE TABLE orders;          -- 更新统计信息（改善计划）
OPTIMIZE TABLE orders;         -- 重建表/回收空间（大表慎用，会阻塞或耗时）
CHECK TABLE orders;            -- 检查
REPAIR TABLE orders;           -- 修复（仅 MyISAM 有效，InnoDB 请用备份恢复）
FLUSH TABLES WITH READ LOCK;   -- 全局读锁，配合备份使用，务必记得 UNLOCK TABLES
UNLOCK TABLES;
```

## 35. 常见错误码与处置

| 错误码 | 信息 | 常见原因与处置 |
| --- | --- | --- |
| 1045 | Access denied | 账号/密码/主机不匹配；`SELECT user,host FROM mysql.user` 核对 |
| 2002/2003 | Can't connect | 服务未启动、端口/防火墙、`bind-address` 限制、socket 路径错 |
| 1040 | Too many connections | `max_connections` 不足或连接池泄漏；先查 `Threads_connected` |
| 1041 | Out of memory | 每连接缓冲过大 × 连接数超内存；调小 buffer 或增内存 |
| 1054 | Unknown column | 列名拼错、用了不存在的别名 |
| 1062 | Duplicate entry | 唯一键冲突；用 `INSERT ... ON DUPLICATE KEY UPDATE` 或先查后插 |
| 1064 | Syntax error | 语法错误，注意保留字需反引号、版本不支持的语法 |
| 1205 | Lock wait timeout | 长事务或未提交事务持锁；查 `sys.innodb_lock_waits` |
| 1213 | Deadlock found | 死锁；应用层捕获并重试整个事务；统一访问顺序、补索引 |
| 1146 | Table doesn't exist | 库选错、表名大小写（`lower_case_table_names`） |
| 1366 | Incorrect string value | 字符集不支持（emoji 需 `utf8mb4`）、非法字节 |
| 1406/1231 | Data too long | 列长度不足或 `sql_mode` 严格模式 |
| 1267 | Illegal mix of collations | JOIN 两边排序规则不一致，统一 collation |
| 1114 | The table is full | 磁盘满或 `innodb_temp_data_file_path` 上限 |
| 1317 | Query execution interrupted | 被 `KILL` 或被超时中断 |
| 1698 | Access denied (auth_socket) | Ubuntu root 使用 socket 认证，用 `sudo mysql` 或改认证方式 |
| 1290 | --secure-file-priv | 导入导出路径不在允许目录内 |

## 36. 5.7 / 8.0 / 8.4+ 主要差异

| 项目 | 5.7 | 8.0 | 8.4 / 9.x |
| --- | --- | --- | --- |
| 默认字符集 | latin1 | `utf8mb4` | `utf8mb4` |
| 默认排序规则 | `utf8mb4_general_ci` | `utf8mb4_0900_ai_ci` | `utf8mb4_0900_ai_ci` |
| 认证插件 | `mysql_native_password` | `caching_sha2_password` | `mysql_native_password` 默认不加载 |
| `default_authentication_plugin` | 可用 | 可用（已弃用） | **已移除**，改用 `authentication_policy` |
| 窗口函数 / CTE | 不支持 | 支持 | 支持 |
| JSON 增强 / JSON_TABLE | 部分 | 支持 | 支持 |
| 查询缓存 | 有（默认关） | **已移除** | 无 |
| redo 日志参数 | `innodb_log_file_size` | 8.0.30+ 用 `innodb_redo_log_capacity` | 仅 `innodb_redo_log_capacity` |
| 复制语法 | `CHANGE MASTER TO` / `START SLAVE` | 8.0.23+ 推荐 `CHANGE REPLICATION SOURCE TO` / `START REPLICA` | 用 `SOURCE`/`REPLICA` 术语；`SHOW MASTER STATUS` 等旧语法逐步移除 |
| 默认 `sql_mode` | 无 `ONLY_FULL_GROUP_BY`-严格组合 | 含 `ONLY_FULL_GROUP_BY`、`STRICT_TRANS_TABLES` 等 | 同 8.0 |
| 集合运算 INTERSECT/EXCEPT | 无 | 8.0.31+ | 支持 |

## 37. 危险操作清单（执行前必须停顿）

| 操作 | 风险 | 前置要求 |
| --- | --- | --- |
| `DROP DATABASE` / `DROP TABLE` | 不可恢复 | 完成备份 + 恢复演练 + 二次确认 |
| `TRUNCATE TABLE` | 不可回滚、隐式提交 | 确认无需回滚、无外键依赖 |
| `DELETE` / `UPDATE` 无 `WHERE` | 全表变更、binlog 暴增、主从延迟 | 先用 `SELECT COUNT(*)` 核对；改用分批 |
| 大表 `ALTER TABLE`（COPY 算法） | 长时间锁表、磁盘翻倍 | 预演 + 在线工具 + 停止阈值 |
| `FLUSH TABLES WITH READ LOCK` | 阻塞所有写入 | 显式 `UNLOCK TABLES` 计划，避免忘记 |
| `RESET BINARY LOGS AND GTIDS`（旧名 `RESET MASTER`） | 破坏 binlog 链，PITR 失效 | 确认复制拓扑与备份策略 |
| `KILL` 大批会话 / 重启实例 | 业务中断、事务回滚 | 先定位根因，保留证据 |
| `GRANT ALL ON *.* TO ...@'%'` | 权限失控 | 禁止；按最小权限授予 |
| `SET GLOBAL` 关键参数 | 影响全实例 | 计算内存上界 + 回滚方案 |
| 直接改 `mysql` 系统库表 | 数据字典不一致 | 用官方 DDL 语句代替 |

## 38. 日常巡检清单（建议脚本化）

1. 实例存活、`Uptime` 是否异常重置。
2. 连接数、`Aborted_connects`、`Threads_running`。
3. 慢查询数量与 Top SQL；全表扫描表清单。
4. 复制状态、延迟、错误日志中的 ERROR/WARNING。
5. 磁盘剩余空间、binlog 增长速度与保留情况。
6. 长事务（`information_schema.INNODB_TRX` 中运行时间超阈值的）。
7. 锁等待与死锁次数。
8. 最近备份是否成功、**最近一次恢复演练是否通过**。
9. 账号与权限变更审查。

## 39. 官方来源与延伸阅读

- MySQL 8.4 参考手册：https://dev.mysql.com/doc/refman/8.4/en/
- MySQL 9.x 参考手册（含 9.7 LTS）：https://dev.mysql.com/doc/refman/9.7/en/
- 版本发布与生命周期：https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html
- 产品生命周期公告：https://www.mysql.com/support/eol-notice.html
- MySQL Shell 工具（dump/load/升级检查）：https://dev.mysql.com/doc/mysql-shell/en/
- Performance Schema / sys schema：https://dev.mysql.com/doc/refman/8.4/en/sys-schema.html

---

## 附：本文档的使用边界

- 本文中的 SQL 为**语法参考**，未在用户的任何生产实例上执行过；执行前请按第 0 章"三件套"确认目标、影响与回滚。
- 参数默认值与特性存在版本差异，最终以对应版本的官方手册与本机 `SHOW VARIABLES` 实测为准。
- 涉及生产写入、DDL、权限、参数持久化、复制切换与恢复覆盖的操作，需经明确授权并在备份可恢复的前提下执行。
