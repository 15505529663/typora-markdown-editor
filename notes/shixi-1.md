##### 第二步：跟一个完整的业务请求链路

建议选一个简单且完整的接口，从 Controller 一路看到数据库，比如：

* Controller 层：找一个带 @RestController 的类（如 UavController），看一个查询方法

关注：@RequestMapping 路径、@GetMapping/@PostMapping、参数接收方式（@RequestBody、@RequestParam、@PathVariable）

* Service 层：看 Controller 调用的 Service 方法

关注：业务逻辑处理（校验、计算、调用其他 Service）、事务注解 @Transactional

* Mapper 层：看 Service 调用的 Mapper 接口

关注：方法名对应的 XML SQL（在 resources/mapper/ 目录下）

* Entity/VO/DTO：看数据在各层之间的转换

Entity：数据库表映射

DTO：接收前端参数

VO：返回给前端的数据

##### 

##### 第三步：理解项目的"通用能力"

看 common/ 包下的核心组件，这些会被所有业务模块复用：

* 统一返回：找 Result 或 NewObjectRestResponse 类，理解返回格式（status、message、data）
* 异常处理：找 @RestControllerAdvice 或 @ControllerAdvice 类，看如何统一处理异常
* 拦截器：common/interceptor/ 下的类，看如何做登录校验、权限校验、日志记录
* 工具类：common/util/ 下的常用工具（日期、字符串、加密等）

##### 

##### 第四步：看核心业务模块

选择你最可能接触的业务模块深入，比如：

* 飞行计划：biz/plan/（申报、审批、调度）
* 设备管理：biz/device/（无人机、反制设备、厂商）
* 空域管理：biz/space/（空域、航线、起降点）
* 活动管理：biz/activity/（任务活动、实时追踪）

每个模块看：

* entity/：有哪些表，字段含义
* controller/ 或 rest/：提供哪些接口
* service/：核心业务逻辑
* mapper/：数据库操作
* dto/、vo/：入参出参结构

##### 

##### 第五步：看配置如何生效

回到 common/configuration/ 包，看几个关键配置类：

* RedisConfig 或类似类：Redis 如何配置多数据源
* SecurityConfig 或 WebMvcConfig：安全配置、跨域、拦截器注册
* SwaggerConfig 或 SpringDocConfig：接口文档配置

建议学习节奏

* 今天：启动类 + 一个完整接口链路（比如查询设备列表）
* 明天：通用组件（统一返回、异常处理、拦截器）
* 后天：一个核心业务模块（如飞行计划或设备管理）
* 之后：根据实际接到的需求，针对性看相关模块

