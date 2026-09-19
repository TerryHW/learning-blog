# MySQL操作指南

## 1. 下载及安装（Win）

### 1.1 安装

- 下载地址：[<u>下载</u>](https://dev.mysql.com/downloads/mysql/)

- 选择zip格式下载：

  名称参考：Windows(x86,64-bit),ZIP Archive,然后点击‘Download’.

### 1.2 安装

- 解压：将下载的压缩包解压到C盘根目录下，如：C:\mysql-26.7.0

- 在mysql-26.7.0文件夹下，新建my.ini文件，进行配置，如下：

  ```
   [mysqld]
   # 设置3306端口
   port=3306
   # 设置mysql的安装目录 basedir=C:\\mysql-26.7.0
   # 设置 mysql数据库的数据的存放目录，MySQL 8+ 不需要以下配置，系统自己生成即可，否则有可能报错
   # datadir=C:\\mysql-26.7.0\\data
  ```

###  1.3 数据库初始化

- 执行初始化命令：

  ```
  “C:\mysql-26.7.0\bin\mysqld.exe” --initialize-insecure
  ```

- 制作Windows服务，基于Windows服务管理(**mysql157**是自定义服务名）

  ```
  C:\mysql-26.7.0\bin\mysqld.exe” --install mysql157
  ```

- 启动服务

  ```
  net start mysql157
  ```

- 关闭服务

  ```
  net stop mysql157
  ```

- 删除Windows服务

  ```
  C:\mysql-8.0.11\bin\mysqld.exe” --remove mysql157
  ```

### 1.4  测试连接

- 连接测试（IP；端口；用户名；密码）

  ```
  C:\mysql-26.7.0\bin\mysql.exe” -h 127.0.0.1 -P 3306 -u root -p
  ```

## 2. Mysql操作命令

### 2.1  新建

- 新建数据库
- 新建数据表

### 2.2 查询

### 2. 3 增加

### 2.4 修改

### 2.5  更新





