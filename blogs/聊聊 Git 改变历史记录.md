##聊聊 Git 「改变历史」

> 非常感谢你为 [mint-ui](https://github.com/ElemeFE/mint-ui) 修复了这个 issue。不过你的 commit 信息能修改成如下格式吗？「issue 666: Any message about this issue」。
>
> 当我兴高采烈向 [Element](https://github.com/ElemeFE/element) 提交 PR 的时候，维护者告诉我你能把你多个 commits 合成一个 commit 吗？我们需要保持提交历史清晰明了。
>
> 修复了一个线上 master 分支的Bug，发现这个 Bug 在当前 dev 分支也是存在的，怎么将master分支上的 bugfix 的 commit 移植到 dev 分支呢？

其实上面的问题会经常出现在我们的开发过程中，或者是在向一些开源项目提交 PR 的时候。在本篇文章中，我将重现以上问题，聊聊 Git 怎么改变历史记录。

## 重写最后一次提交

在我们开发的过程中，我们经常会遇到这样的问题，当我们进行了一次「冲动」的 Git 提交后。发现我们的 commit 信息有误，或者我们把不应该这次提交的文件添加到了此次提交中，或者有的文件忘记提交了，怎么办？这些问题都可以通过如下命令来进行弥补。

> Git commit --amend 

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
# 其次，将 should-not-commit.js 文件从已暂存状态转为未暂存状态
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

## 多个提交合并成一个提交

在一个大型项目中，为了保持提交历史的简洁和可逆，往往一个功能点或者一个 bug fix 对应一个提交，但是在我们实际开发的过程中，我们并不是完成整个功能才进行一次提交的，往往是开发了功能点的一部分，就需要给小伙伴们进行 code review，小的 commit 保证了 code review 的效率和准确性，想象一下如果一次给小伙伴 review 上千行代码，几十个文件，他一定会疯掉的。同时 code review 后的反馈，我们可能需要修改代码，然后再次提交。但是这些提交之间的反复修改不应该体现在最终的 PR 上面，因此，我们需要将多个 commit 合并成一个 commit 后提 PR。

举个例子，我要开发一个新功能，「设置 header 元素字体大小为 18px。」（好吧，姑且算是一个功能），当我写完代码提交后，打包电脑，准备回家之前，把页面效果给产品经理看，产品经理皱了皱眉头，说道「字体有点小啊，要不你设置成 24px 看看？」

通过 git log --oneline 看看现在的提交记录。

```Shell
# 第一次我的提交如下
4aef53f (HEAD -> master) set font-size: 18px
```

好吧，我修改了字体大小为 24px 又进行了一次提交。

```shell
# 第二次修改后的提交记录如下
fc10336 (HEAD -> master) reset fontsize: 24px
4aef53f set font-size: 18px
```

心想，这次产品经理总该满意了吧，再次给产品经理看看效果，产品经理面带疑虑，「呀，这是 24px 吗？我怎么感觉字体有点大了，而且都换行了，要不你再设置成 20px 看看？」

我再次修改，字体大小为 20px，再次提交。

```shell
75e3374 (HEAD -> master) set font-size: 20px, once more
fc10336 reset fontsize: 24px
4aef53f set font-size: 18px
```

当产品经理看到第三次修改后的效果时，终于露出了满意的笑容。我心想，我可不能把这些反复的历史提交记录留在最终版本库中，是时候再次「改变历史」记录了。

这次我使用的命令是 git rebase -i 或者 git rebase - -interactive， Git 官方文档对其如下解释：

> Make a list of the commits which are about to be rebased. Let the user edit that list before rebasing. This mode can also be used to split commits 

可以看出，该命令罗列了将要 rebase 的提交记录，打开 Git 设置的编辑器，让用户有更多的选择，可以进行 commit 合并，对 commits 重新排序，修改 commit 信息等。

在上面的例子中，我想要合并 master 分支最近的三个 commits，并修改提交信息，使用如下命令：

> Git rebase -i master~2

出来如下对话信息：

```shell
pick fc10336 reset fontsize: 24px
pick 75e3374 set font-size: 20px, once more

# Rebase 4aef53f..75e3374 onto 4aef53f (2 commands)
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

有上面的对话信息我们可以看到，有七个命令可选，而当前的默认选择为 pick，也就是说使用当前提交，而我的目的是合并最近三个 commit，因此我选择 s，squash 命令，该命令会将当前 commit 合并到它前一个 commit 中，修改最上面两行代码如下：

```shell
s fc10336 reset fontsize: 24px
s 75e3374 set font-size: 20px, once more
```

然后保存并推出编辑器，啊哈，Git 又帮我打开了如下对话，告诉我，这是三次 commit 的合并，你可以修改你的提交信息。好吧，我把第二次和第三次的提交信息通过「#」符号注释掉，然后将第一次的提交信息修改为最终的功能描述信息「set font-size: 20px」。保存并退出。

```shell
# This is a combination of 3 commits.
# This is the 1st commit message:

set font-size: 20px

# This is the commit message #2:

# reset fontsize: 24px

# This is the commit message #3:

# set font-size: 20px, once more

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
# ...
```

再来看看当前的提交历史，啊哈！又一次成功改变历史。

```shell
8e198ec (HEAD -> master) set font-size: 20px
```

**思考2：**假如我又不想合并三个 commits 了，怎么使用 git reset 将其恢复到合并前状态？

**思考3：**在「重写最后一次提交」部分，使用 git commit --amend 可以修改最后一次提交记录，那么用 git rebase -i 怎么去重写历史提交中的任意一条提交信息呢？

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