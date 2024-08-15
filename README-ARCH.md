## 核心概念

### Argo

Argo 是一个开源的工作流引擎，用于在Kubernetes上执行工作流。
Argo 提供了一个简单、灵活、可靠的工作流引擎，用于在Kubernetes上执行工作流。
Argo 可以执行任何类型的工作流，例如：数据处理、机器学习、CI/CD等。
Argo 可以在Kubernetes上运行，也可以在云上运行。

### 工作流 Workflow

工作流是一个任务的有序集合，它定义了任务的执行逻辑。
工作流可以是一个DAG（有向无环图），也可以是一个Steps（线性）。
工作流可以定义输入参数和输出参数，以及工作流的执行策略。
工作流可以定义工作流的执行策略，例如：并行执行、串行执行、失败重试、超时等。

Workflow 是Argo中最重要的资源，具有两个重要功能： 
1. 它定义了要执行的工作流。
2. 它存储工作流的状态。

Workflow 是一个自定义资源，它是一个Kubernetes资源，可以通过Kubernetes API服务器进行创建、更新和删除。
Workflow 由一个或多个步骤组成，每个步骤都是一个容器。Workflow 可以定义输入参数和输出参数，以及工作流的执行策略。

Workflow 有两种类型：

1. DAG（有向无环图）：DAG 是一种工作流类型，其中工作流的步骤以有向无环图的形式组织。DAG 工作流的步骤可以并行执行，也可以串行执行。
2. Steps：Steps 是一种工作流类型，其中工作流的步骤以线性方式组织。Steps 工作流的步骤按照定义的顺序依次执行。
3. 两种类型的工作流可以混合使用。
4. Workflow 可以定义输入参数和输出参数，以及工作流的执行策略。
5. Workflow 可以定义工作流的执行策略，例如：并行执行、串行执行、失败重试、超时等。


#### Workflow Spec

要执行的工作流在 Workflow.spec 字段中定义。工作流规范的核心结构是 templates 和 entrypoint 的列表。

templates 可以粗略地理解为“函数”：它们定义了要执行的指令。 entrypoint 字段定义了“main”函数是什么，即首先执行的模板。

下面是一个简单的工作流示例，其中定义了一个名为 whalesay 的模板，该模板使用 docker/whalesay 镜像运行一个容器，该容器运行 cowsay 命令并将 hello world 作为参数传递给它：

```yaml

apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: hello-world-
spec:
    entrypoint: whalesay
    templates:
      - name: whalesay
        container:
            image: docker/whalesay:latest
            command: [cowsay]
            args: ["hello world"]

```

##### template Types

Template Definitions

Argo支持6种模板类型：

1. 容器 Container：也许是最常见的模板类型，它将调度一个容器。模板的规范与Kubernetes容器规范相同，因此您可以在这里定义容器，就像在Kubernetes的其他任何地方一样。

example:

```yaml

- name: hello-world
  container:
    image: busybox
    command: [echo]
    args: ["hello world"]

```

2. 脚本 Script：
围绕 container 的便利包装。
规范与容器相同，**但添加了 source:** 字段，允许您在适当的位置定义脚本。
该脚本将被保存到一个文件中并为您执行
脚本的结果会自动导出到Argo变量 {{tasks.<NAME>.outputs.result}} 或 {{steps.<NAME>.outputs.result}} 中，具体取决于调用方式。

example:

```yaml

- name: hello-world
  script:
    image: python:alpine3.6
    source: |
      #!/usr/bin/env python
      print("hello world")

```

3. 资源 Resource：
   直接对群集资源执行操作。它可用于获取、创建、应用、删除、替换或修补集群上的资源。
    例如，您可以使用资源模板来创建一个新的 ConfigMap，然后将其应用于群集中的一个或多个 Pod。

example:

```yaml

- name: create-configmap
  resource:
    action: create
    manifest: |
      apiVersion: v1
      kind: ConfigMap
      metadata:
        name: my-configmap
      data:
        my-key: my-value

```

4.  暂停 Suspend：
    挂起模板将暂停执行，暂停时间或直到手动恢复。挂起模板可以从CLI（使用 argo resume ）、API端点或UI恢复。

example:

```yaml

- name: delay
  suspend:
  duration: "20s"

```

5. 步骤 Step：
   这些模板用于调用/调用其他模板并提供执行控制。
   步骤模板允许您在一系列步骤中定义任务。模板的结构是“列表”。 
    外部列表将按顺序运行，内部列表将并行运行。
    如果要逐一运行内部列表，请使用同步功能。您可以设置各种选项来控制执行，例如 when: 子句有条件地执行步骤。

example:
    
```yaml

- name: hello-hello-hello
  steps:
    - - name: step1
        template: prepare-data
    - - name: step2a
        template: run-data-first-half
      - name: step2b
        template: run-data-second-half

```

6. DAG Directed Acyclic Graph：
   DAG模板允许您定义一个有向无环图，其中节点是模板。这使您可以定义复杂的工作流，其中一些步骤可以并行运行，而其他步骤必须等待其他步骤完成。

example:
    
```yaml

- name: my-dag
  dag:
    tasks:
      - name: A
        template: whalesay
      - name: B
        dependencies: [A]
        template: whalesay
      - name: C
        dependencies: [A]
        template: whalesay
      - name: D
        dependencies: [B, C]
        template: whalesay

```


### template types

1. HTTP Template is a type of template which can execute HTTP Requests.

```yaml

apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: http-template-
spec:
  entrypoint: main
  templates:
    - name: main
      steps:
        - - name: get-google-homepage
            template: http
            arguments:
              parameters: [{name: url, value: "https://www.google.com"}]
    - name: http
      inputs:
        parameters:
          - name: url
      http:
        timeoutSeconds: 20 # Default 30
        url: "{{inputs.parameters.url}}"
        method: "GET" # Default GET
        headers:
          - name: "x-header-name"
            value: "test-value"
        # Template will succeed if evaluated to true, otherwise will fail
        # Available variables:
        #  request.body: string, the request body
        #  request.headers: map[string][]string, the request headers
        #  response.url: string, the request url
        #  response.method: string, the request method
        #  response.statusCode: int, the response status code
        #  response.body: string, the response body
        #  response.headers: map[string][]string, the response headers
        successCondition: "response.body contains \"google\"" # available since v3.3
        body: "test body" # Change request body

```

Argo Agent
http template 使用 argo agent 来执行 http 请求，argo agent 是一个独立的进程，它运行在 pod 中，它可以执行 http 请求，也可以执行其他任务。


2. Container Set Template
   容器集模板与普通容器或脚本模板类似，但允许您指定多个容器在单个 Pod 中运行。
   因为一个 Pod 中有多个容器，所以它们将被安排在同一主机上。您可以使用廉价且快速的空目录卷而不是持久卷声明来在步骤之间共享数据。

```yaml

apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: container-set-template-
spec:
  entrypoint: main
  templates:
    - name: main
      volumes:
        - name: workspace
          emptyDir: { }
      containerSet:
        volumeMounts:
          - mountPath: /workspace
            name: workspace
        containers:
          - name: a
            image: argoproj/argosay:v2
            command: [sh, -c]
            args: ["echo 'a: hello world' >> /workspace/message"]
          - name: b
            image: argoproj/argosay:v2
            command: [sh, -c]
            args: ["echo 'b: hello world' >> /workspace/message"]
          - name: main
            image: argoproj/argosay:v2
            command: [sh, -c]
            args: ["echo 'main: hello world' >> /workspace/message"]
            dependencies:
              - a
              - b
      outputs:
        parameters:
          - name: message
            valueFrom:
              path: /workspace/message

```


3. Data Sourcing and Transformations
   数据源和转换模板允许您从外部数据源（例如 S3 存储桶）加载数据，然后将其转换为工作流中的参数。

```shell

find -r . | grep ".pdf" | sed "s/foo/foo.ready/"

```

In Argo, this operation would be written as:


```yaml

- name: generate-artifacts
  data:
    source:             # Define a source for the data, only a single "source" is permitted
      artifactPaths:    # A predefined source: Generate a list of all artifact paths in a given repository
        s3:             # Source from an S3 bucket
          bucket: test
          endpoint: minio:9000
          insecure: true
          accessKeySecret:
            name: my-minio-cred
            key: accesskey
          secretKeySecret:
            name: my-minio-cred
            key: secretkey
    transformation:     # The source is then passed to be transformed by transformations defined here
      - expression: "filter(data, {# endsWith \".pdf\"})"
      - expression: "map(data, {# + \".ready\"})"

```


4. Inline Templates
   内联模板允许您在工作流规范中定义模板

* Steps

```yaml

apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: dag-inline-
  labels:
    workflows.argoproj.io/test: "true"
  annotations:
    workflows.argoproj.io/description: |
      This example demonstrates running a DAG with inline templates.
    workflows.argoproj.io/version: ">= 3.2.0"
spec:
  entrypoint: main
  templates:
    - name: main
      dag:
        tasks:
          - name: a
            inline:
              container:
                image: argoproj/argosay:v2

```


* DAG



```yaml

apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: dag-inline-
  labels:
    workflows.argoproj.io/test: "true"
  annotations:
    workflows.argoproj.io/description: |
      This example demonstrates running a DAG with inline templates.
    workflows.argoproj.io/version: ">= 3.2.0"
spec:
  entrypoint: main
  templates:
    - name: main
      dag:
        tasks:
          - name: a
            inline:
              container:
                image: argoproj/argosay:v2

```




### Workflow Templates 工作流模板





### 任务

任务是一个容器，它是工作流的基本执行单元。任务可以是一个容器，也可以是一个脚本。任务可以定义输入参数和输出参数，以及任务的执行策略。

任务有两种类型：
1. Container：Container 是一种任务类型，它是一个容器。
2. Script：Script 是一种任务类型，它是一个脚本。
3. 两种类型的任务可以混合使用。
4. 任务可以定义输入参数和输出参数，以及任务的执行策略。
5. 任务可以定义任务的执行策略，例如：失败重试、超时等。

### 参数

参数是工作流和任务的输入和输出。参数可以是字符串、整数、浮点数、布尔值、列表、字典等类型。



### 任务模板

任务模板定义了一个任务的执行逻辑。任务模板可以定义输入参数和输出参数，以及任务的执行策略。

任务模板有两种类型：
1. Container：Container 是一种任务模板类型，它是一个容器。
2. Script：Script 是一种任务模板类型，它是一个脚本。
3. 两种类型的任务模板可以混合使用。
4. 任务模板可以定义输入参数和输出参数，以及任务的执行策略。
5. 任务模板可以定义任务的执行策略，例如：失败重试、超时等。
6. 任务模板可以定义任务的执行逻辑，例如：执行脚本、执行容器等。
7. 任务模板可以定义任务的执行环境，例如：容器镜像、容器资源等。

### 工作流模板

工作流模板定义了一个工作流的执行逻辑。工作流模板可以定义输入参数和输出参数，以及工作流的执行策略。

工作流模板有两种类型：
1. DAG：DAG 是一种工作流模板类型，其中工作流的步骤以有向无环图的形式组织。DAG 工作流的步骤可以并行执行，也可以串行执行。
2. Steps：Steps 是一种工作流模板类型，其中工作流的步骤以线性方式组织。Steps 工作流的步骤按照定义的顺序依次执行。
3. 两种类型的工作流模板可以混合使用。
4. 工作流模板可以定义输入参数和输出参数，以及工作流的执行策略。


### 事件

事件是工作流的状态变化。事件可以是工作流的创建、更新、删除、启动、停止、完成、失败等。事件可以触发工作流的执行逻辑。


### 传感器

传感器是一种特殊的任务，它可以监听事件，并触发工作流的执行逻辑。
传感器可以监听工作流的状态变化，例如：工作流的创建、更新、删除、启动、停止、完成、失败等。
传感器可以触发工作流的执行逻辑，例如：启动工作流、停止工作流、重试工作流等。传感器可以定义输入参数和输出参数，以及传感器的执行策略。

### 仪表板

仪表板是一个Web界面，用于可视化工作流的执行状态。
仪表板可以显示工作流的执行日志、执行时间、执行结果等。仪表板可以显示工作流的执行状态，例如：创建、更新、删除、启动、停止、完成、失败等。
仪表板可以显示工作流的执行图，例如：DAG、Steps等。
仪表板可以显示工作流的执行参数，例如：输入参数、输出参数等。
仪表板可以显示工作流的执行策略，例如：并行执行、串行执行、失败重试、超时等。

### 通知

通知是一种事件触发机制，它可以通知用户工作流的状态变化。
通知可以是工作流的创建、更新、删除、启动、停止、完成、失败等。通知可以触发用户的执行逻辑，例如：发送邮件、发送短信、发送消息等。
通知可以定义输入参数和输出参数，以及通知的执行策略。

### 任务执行器

任务执行器是一种执行任务的引擎，它可以执行任务的逻辑。
任务执行器可以执行容器任务、脚本任务等。任务执行器可以定义输入参数和输出参数，以及任务的执行策略。
任务执行器可以定义任务的执行环境，例如：容器镜像、容器资源等。
