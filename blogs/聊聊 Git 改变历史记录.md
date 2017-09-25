##聊聊 Git 「改变历史」

> 非常感谢你为 [mint-ui](https://github.com/ElemeFE/mint-ui) 修复了这个 issue。不过你的 commit 信息能修改成如下格式吗？「issue 666: Any message about this issue」。
>
> 当我兴高采烈向 [Element](https://github.com/ElemeFE/element) 提交 PR 的时候，维护者告诉我你能把你多个 commits 合并成一个 commit 吗？我们需要保持提交历史清晰明了。
>
> 修复了一个线上 master 分支的Bug，发现这个 Bug 在当前 dev 分支也是存在的，怎么将master分支上的 bugfix 的 commit 移植到 dev 分支呢？

其实上面的问题会经常出现在我们的开发过程中，或者是在向一些开源项目提交 PR 的时候。在本篇文章中，我将重现以上问题，聊聊 Git 怎么改变历史记录。

## 重写最后一次提交

在我们开发的过程中，我们经常会遇到这样的问题，当我们进行了一次「冲动」的 Git 提交后。发现我们的 commit 信息有误，或者我们把不应该这次提交的文件添加到了此次提交中，或者有的文件忘记提交了，怎么办？这些问题都可以通过如下命令来进行弥补。

> git commit --amend 

举个例子，在一个刚初始化的 Git 仓库中，有如下两个文件：

```shell
total 0
-rw-r--r--  1 ransixi  staff     0B  9 19 16:35 should-commit.js
-rw-r--r--  1 ransixi  staff     0B  9 19 16:35 should-not-commit.js
```

其中 should-commit.js 文件应该被提交，而 should-not-commit.js 不应该被提交，但是由于「冲动」，我把 should-not-commit.js 文件提交了。

```shell
# 其实应该添加 should-commit.js 文件
git add should-not-commit.js
# 啊哈，由于笔误，我把 commit 写成了 commmit
git commit -m 'commmit 1'
```

通过 git log 命令打印下当前的历史提交记录：

```shell
commit fba6199e7fd5f325cc0bfcec4c599c93603d48f8 (HEAD -> master)
Author: ran.luo03 <ran.luo03@ele.me>
Date:   Tue Sep 19 16:49:57 2017 +0800

    commmit 1
```

这样的错误的提交一定不能够给别人看到！是时候该祭出 git commit --amend 了。

```Shell
# 首先，需要将 should-commit.js 文件添加到暂存区
git add should-commit.js
# 其次，将 should-not-commit.js 文件从已暂存状态转为未暂存状态，不会删除 should-not-commit.js 文件。
git rm --cache should-not-commit.js
# 最后，通过git commit --amend 修改提交信息
git commit--amend
```

当键入 git commit —amend 命令后，会打开 Git 默认编辑器，内容包括了上次错误提交的信息，我们只需将 commmit 1 改为 commit 1 就行了，然后保存退出编辑器。这样我们就完成了错误提交的修改，让我们再通过 git log 来查看一下历史提交记录：

```shell
commit 2a410384e14dadaff9b98f823b9f239da055637d (HEAD -> master)
Author: ran.luo03 <ran.luo03@ele.me>
Date:   Tue Sep 19 16:49:57 2017 +0800

    commit 1
```

啊哈，整个历史记录中只有我最新修改后的历史提交，你完全找不到上一次的提交踪迹了。是不是很酷呢？

**思考1：**怎么使用 git reset 命令修改最后一次提交记录？

## 多个提交合并、排序、删除操作

在一个大型项目中，为了保持提交历史的简洁和可逆，往往一个功能点或者一个 bug fix 对应一个提交，但是在我们实际开发的过程中，我们并不是完成整个功能才进行一次提交的，往往是开发了功能点的一部分，就需要给小伙伴们进行 code review，小的 commit 保证了 code review 的效率和准确性，想象一下如果一次给小伙伴 review 上千行代码，几十个文件，他一定会疯掉的。同时 code review 后的反馈，我们可能需要修改代码，然后再次提交。但是这些提交之间的反复修改不应该体现在最终的 PR 上面，因此， 我们需要根据功能点的前后对 commit 进行排序，对相同功能的commits 进行合并，并删除一些不需要的 commit，根据最终的提交历史提 PR。

举个例子，将王之涣的**登鹳雀楼**摘抄到我的读书笔记中。

首先创建 poem 文件，将「黄河入海流」这句诗添加到了文件中，创建第一个 commit 如下：

通过 git log --oneline 命令来看看提交记录。

```shell
da5ee49 (HEAD -> master) add 黄河入海流
```

 后来觉得，摘抄一句有些单调，不如将其前面一句也摘抄到笔记中吧，于是又出现了第二个 commit 如下：

```shell
622c3c8 (HEAD -> master) add 百日依山尽
da5ee49 add 黄河入海流
```

...

觉得自己太随性，摘抄一首诗竟然添加了如此之多的 commits，commits 如下：

```shell
953aabb (HEAD -> master) add 文章出处
7fad941 add 摘抄时间
731d00b add 作者：王焕之
9a22044 add 标题：登鹳雀楼
4fee22a add 更上一层楼
d1293c5 add 欲穷千里目
622c3c8 add 百日依山尽
da5ee49 add 黄河入海流
```

再看看上面的提交历史，觉得如此多的 commits 确实有些冗余了，commits 的顺序似乎也有些问题，因为 commits 的顺序并不是按照正常摘抄一首诗的顺序来组织的。而且觉得添加摘抄时间有些多余了，git 的历史提交记录就已经帮我记录了添加时间。

让我们来一步一步通过「重写历史」来修改上面的问题。

这次我使用的命令是 git rebase -i 或者 git rebase - -interactive， Git 官方文档对其如下解释：

> Make a list of the commits which are about to be rebased. Let the user edit that list before rebasing. This mode can also be used to split commits 

可以看出，该命令罗列了将要 rebase 的提交记录，打开 Git 设置的编辑器，让用户有更多的选择，可以进行 commit 合并，对 commits 重新排序，删除 commit 等。

**第一步：删除「add 摘抄时间」commit**

运行命令

> git rebase -i HEAD~2

Git 打开默认编辑器，出来如下对话信息：

```Shell
pick 7fad941 add 摘抄时间
pick 953aabb add 文章出处

# Rebase 731d00b..953aabb onto 731d00b (2 commands)
#
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# x, exec = run command (the rest of the line) using shell
# d, drop = remove commit
```

上面的对话信息中包含七条可选命令，很明显最后一条 d，drop 正式我需要的，因为我正打算删除 commit。于是我把第一行中的 pick 命令改为了 drop 命令。

```shell
drop 7fad941 add 摘抄时间
pick 953aabb add 文章出处
```

保存并推出编辑器。

```shell
Auto-merging poem
CONFLICT (content): Merge conflict in poem
error: could not apply 953aabb... add 文章出处

When you have resolved this problem, run "git rebase --continue".
If you prefer to skip this patch, run "git rebase --skip" instead.
To check out the original branch and stop rebasing, run "git rebase --abort".

Could not apply 953aabb... add 文章出处
```

OMG!竟然竟然提示 poem 文件中有冲突！打开 poem 文件，手动删除不需要的内容及冲突的标记符号，按照上面的提示，运行 git rebase --continue 命令。心想，这下总该好了吧！

```shell
poem: needs merge
You must edit all merge conflicts and then
mark them as resolved using git add
```

rebase 依然没有成功，原来忘记将解决冲突的修改添加到暂存区了，通过运行 git add 命令后，再次执行 git rebase —continue。

出来一个对话框，提示我可以修改 commit 信息，没有修改，直接保存退出。来看看此时的提交历史记录。

```shell
b8f0233 (HEAD -> master) add 文章出处
731d00b add 作者：王焕之
9a22044 add 标题：登鹳雀楼
4fee22a add 更上一层楼
d1293c5 add 欲穷千里目
622c3c8 add 百日依山尽
da5ee49 add 黄河入海流
```

和之前的 commits log 信息进行对比，发现 `7fad941 add 摘抄时间` 提交，已经被我成功得删除了，虽然期间有些波折。同时我还注意到了，「add 文章出处」的 SHA1的 hash 值也从 953aabb 变成了 b8f0233。说明，该 commit 是新创建的 commit。

**第二步：调整 commits 顺序**

看着上面提交历史记录总会有些别扭，因为不是安装诗本身的顺序来进行提交的，现在我需要修改提交的顺序。好吧，又该是 git rebase -i 命令大显身手的时候到了。

但是现在有个问题，git rebase -i 命令并不能够编辑最初的提交。不巧的是，我正需要改变第一个 commit 的顺序，这儿需要一点小技巧，用到  `--root` 选项，通过该选项，我们就能够编辑初始化的提交了。运行命令如下：

> git rebase -i —root

Git 再次打开编辑器，提示如下对话信息：

```shell
pick da5ee49 add 黄河入海流
pick 622c3c8 add 百日依山尽
pick d1293c5 add 欲穷千里目
pick 4fee22a add 更上一层楼
pick 9a22044 add 标题：登鹳雀楼
pick 731d00b add 作者：王焕之
pick b8f0233 add 文章出处

# Rebase b8f0233 onto a69da76 (7 commands)
#
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# x, exec = run command (the rest of the line) using shell
# d, drop = remove commit
# ...
```

修改上面的提交顺序如下：

```
pick 622c3c8 add 百日依山尽
pick da5ee49 add 黄河入海流
pick d1293c5 add 欲穷千里目
pick 4fee22a add 更上一层楼
pick 9a22044 add 标题：登鹳雀楼
pick 731d00b add 作者：王焕之
pick b8f0233 add 文章出处
...
```

然后保存并推出编辑器。

OMG，依然存在冲突，解决冲突，运行 git add . 和 git rebase —continue。最后来看看现在的历史提交记录：

```shell
ddb6576 (HEAD -> master) add 文章出处
a6e40b3 add 作者：王焕之
ce83346 add 标题：登鹳雀楼
cae4916 add 更上一层楼
f79b9ac add 欲穷千里目
fb65570 add 黄河入海流
8e25185 add 白日依山尽
```

**第三步：合并 commits**

添加标题和添加作者貌似应该放到一个 commit 里面，也就是说，我需要将`a6e40b3 add 作者：王焕之` 提交和 `ce83346 add 标题：登鹳雀楼` 合并成一个提交。这样显得提交更加简洁明晰。

依然使用命令 

> git rebase -i HEAD~3

Git 大概如下对话框：

```shell
pick ce83346 add 标题：登鹳雀楼
pick a6e40b3 add 作者：王焕之
pick ddb6576 add 文章出处

# Rebase cae4916..ddb6576 onto cae4916 (3 commands)
#
# Commands:
# p, pick = use commit
# r, reword = use commit, but edit the commit message
# e, edit = use commit, but stop for amending
# s, squash = use commit, but meld into previous commit
# f, fixup = like "squash", but discard this commit's log message
# x, exec = run command (the rest of the line) using shell
# d, drop = remove commit
# ...
```

这次我使用的命令是 s, squash。该命令用于合并两个或多个 commits，会将选择的 commit 合并到前一个 commt 中。修改上面对话第二行如下：

```shell
pick ce83346 add 标题：登鹳雀楼
squash a6e40b3 add 作者：王焕之
pick ddb6576 add 文章出处
```

然后保存并推出编辑器，啊哈，Git 似乎有点疑惑，它并不知道选择哪个 commit 信息作为合并的最终 commit 信息，于是 Git 打开了新的对话框，让我自己输入新的合并提交信息。

```Shell
# This is a combination of 2 commits.
# This is the 1st commit message:

add 标题：登鹳雀楼

# This is the commit message #2:

add 作者：王焕之

# ...
```

修改如下：

```shell
# This is a combination of 2 commits.
# This is the 1st commit message:

add 标题：登鹳雀楼 作者：王焕之

# This is the commit message #2:

# add 作者：王焕之

# ...
```

保存上面的修改，并推出编辑器。

再来看看最后的历史提交记录

```shell
* b907e51 - (2 hours ago) add 文章出处 - ran.luo (HEAD -> master)
* bd0bfed - (3 hours ago) add 标题：登鹳雀楼 作者：王焕之 - ran.luo
* cae4916 - (3 hours ago) add 更上一层楼 - ran.luo
* f79b9ac - (3 hours ago) add 欲穷千里目 - ran.luo
* fb65570 - (3 hours ago) add 黄河入海流 - ran.luo
* 8e25185 - (3 hours ago) add 白日依山尽 - ran.luo
```

啊哈，该历史提交记录终于是我想要的了。

**思考2：**假如通过 rebase 合并了多个 commits 后，发现并不是我们想要的结果，怎么使用 git reset 将其恢复到合并前状态？

**思考3：** 在上面的例子中，由于 git rebase -i 不能够直接编辑最初的提交记录，因而使用了 `--root` 选项，那么有没有什么方法可以在最初的 commit 之前添加一个 root commit 呢？这样 git rebase -i 就可以直接使用了。

## 将其他分支的某个提交附加到当前分支

还记得文章开头提及的那个问题吗？修复了一个 master 分支上的线上 Bug，完成了项目的测试发布后，发现当前开发分支 dev 也存在同样的问题，怎么办？是把修复 Bug 的代码从 master 分支上线复制一遍到 dev 分支上，这显然效率不高，而且容易复制错误。还是以一个最小的例子来分析 Git 怎么帮我们解决这个问题。

当前版本库有两个分支，master 分支和 dev 分支，master 分支包含一个文件 file1，已经发布到线上，dev 分支是从 master 分支上分离出来的一个新的分支，并且已经完成了新功能的开发，添加了另外一个文件 file2。当前的提交图如下：

```shell
* 132cabb - (4 minutes ago) dev add file2 - ran.luo (dev)
* daaae54 - (4 minutes ago) add file1 - ran.luo (HEAD -> master)
```

上面代码可以看出，当前 HEAD 指向 master 分支，并且发现一个线上 bug，需要紧急修复，我对 file1文件内容进行修改，修复了该 bug。并提交一个新的 commit。当前的提交图如下：

```shell
* c6607dc - (4 seconds ago) master fix bug - ran.luo (HEAD -> master)
| * 132cabb - (6 minutes ago) dev add file2 - ran.luo (dev)
|/
* daaae54 - (7 minutes ago) add file1 - ran.luo
```

因为 dev 分支是从 master 分支上分离出来的新分支，因此先前 master 分支上面的 bug 在 dev 分支上也存在，但是又有谁想再次手写代码修复一遍 bug 呢？这时候我们就需要用到 git cherry-pick 命令。Git 官方文档对其解释如下：

> git-cherry-pick - Apply the changes introduced by some existing commits

由官网文档可知，git-cherry-pick 命令常用于将版本库的一个分支上的特定提交引入到另一个分支上，也就是说，其可以将其他分支带来的改变直接作用到当前分支，这不就是本例所需要的吗？

首先需要切换到 dev 分支，由于我们需要的是版本库中 master 分支上面的最新的一个关于 bug fix 的提交，将其附加到 dev 分支后面，使用如下命令：

> git cherry-pick master

执行完毕后，我们切回 master 分支，再来看看当前的提交图：

```shell
* 439cb35 - (14 minutes ago) master fix bug - ran.luo (dev)
* 132cabb - (20 minutes ago) dev add file2 - ran.luo
| * c6607dc - (14 minutes ago) master fix bug - ran.luo (HEAD -> master)
|/
* daaae54 - (21 minutes ago) add file1 - ran.luo
```

啊哈，成功得将 master 分支的最新提交附加到了 dev 分支上面，又双叒叕一次改变了历史，心中的自豪感悠然而生。

**思考4：**既然 git cherry-pick 可以将某一分支上面的制定提交附加到当前分支上线，那么这样是否可能通过不同的操作顺序来对将要附加的提交进行排序呢？

**思考5：**有时候可能一次需要将版本库中某一分支上面的多个连续的提交一次性的附加到当前分支上面，git cherry-pick （git cherry-pick X..Y）命令是否也能够满足我们的需求呢？

## 写在最后

当我还沉浸在改变历史的成就中难以自拔的时候，身边大佬的一句话让我清醒过来：「历史（记录）没有因你而变，而只是改变了历史（记录）的呈现方式」。当我查阅了.git/objects中的关于记录 commit 的文件后，才发现我还是too young too simple。我并没有改变或删除这些记录 commit 的文件，而只是生成了一些新的 commit 文件，尽然以为我改变了历史记录，可笑！这也是我们为什么能够恢复到改变历史记录前状态的原因，关于Git 中 hash、commit、history 的实质，请参考 [git inside --simplified --part '1'](https://zhuanlan.zhihu.com/p/27474934)。

**Warning**

改变历史提交提交记录并非完美，你需要遵循如下准则，只要没有其他开发人员获取到你版本库的副本，或者没有共享你的提交记录，那么你就可以尽情的完善你的提交记录，可以修改提交信息，合并或者拆分多个提交，对多个提交进行排序等等。不过，记住一点，如果你的版本库已经公开，并且其他开发人员已经共享了你的提交记录，那么你就不应该重写、修改该版本库中的任意部分。否则，你的合作者会埋怨你，你的家人和朋友也会嘲笑你、抛弃你。