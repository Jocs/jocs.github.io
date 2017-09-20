### CSS切角效果的实现

切角效果是时下非常流行的一种设计风格，并广泛运用于平面设计中，它最常见的形态就是把元素的一个或多个切成45°的切口，尤其是在最近几年，扁平化设计盖过拟物化设计后，这种切脚设计更为流行，例如下图就是通过切角实现的一个导航栏，在后面将详细论述起实现。

![](http://content-management.b0.upaiyun.com/1472799493593.png)

#### 1. CSS中的两种渐变（linear-gradient radial-gradient）

在了解切角之前，我们首选来学习下CSS渐变，CSS渐变分两种线性渐变（linear-gradient）和径向渐变（radial-gradient）。

**linear-gradient**

![](http://content-management.b0.upaiyun.com/1472801761152.png)

通过CSS线性渐变函数（linear-gradient）可以生成线性渐变的颜色，这种渐变颜色是通过CSS\<image>数据类型来表示的。而这一线性渐变函数将返回一个CSS\<gradient>数据类型，和其他CSS渐变类型一样，CSS线性渐变并不属于CSS\<color>数据类型，而是一张没有固定尺寸的图片，线性渐变的大小由其应用的元素所决定的。

CSS中的线性渐变是通过一条渐变线（Gradient line）来定义的，渐变线上面的每一个点都具有不同的颜色，渐变线上面每一点的垂直线上面的点具有相同颜色。

线性渐变的语法：

```css
linear-gradient( 

  [ <angle> | to <side-or-corner> ,]? <color-stop> [, <color-stop>]+ )

  where <side-or-corner> = [left | right] || [top | bottom]

  and <color-stop>     = <color> [ <percentage> | <length> ]?
```

线性渐变的语法可以分为两个部分，前面一部分用来定义线性渐变线（gradient line），后面一部分用来定义渐变的颜色点。线性渐变线可以通过两种方式定义，第一种是通过CSS\<angle>来进行定义，例如45deg、135deg等。另外一种是通过CSS\<side-or-corner>来进行定义的，例如to left top、to right bottom等。而渐变颜色点是通过CSS\<color-stop>类型来定义的，该类型又一个CSS颜色和一个可选的百分比值或者长度值来定义，百分比值或者长度值是决定颜色在渐变线上的位置。

下面是一些线性渐变的例子：

>linear-gradient( 45deg, blue, red );           /* A gradient on 45deg axis starting blue and finishing red */
>
>linear-gradient( to left top, blue, red);     
>
> /* A gradient going from the bottom right to the top left  starting blue and  finishing red */
>
>linear-gradient( 0deg, blue, green 40%, red );
>
>/*从下向上的渐变，从蓝色开始，渐变到40%时颜色为green，并以红色结束渐变*/

**radial-gradient**

![](http://laiw.local:53618/Dash/ttxhmmeb/mdn.mozillademos.org/files/3795/radial%20gradient.png)

径向渐变（radial-gradient）主要由渐变的起始圆心、结束的形状和位置、渐变点来定义的。径向渐变函数最终也是返回一个CSS\<gradient>类型。

径向渐变语法如下：

```css
radial-gradient(
  [ [ circle || <length> ]                         [ at <position> ]? , |
    [ ellipse || [ <length> | <percentage> ]{2} ]  [ at <position> ]? , |
    [ [ circle | ellipse ] || <extent-keyword> ]   [ at <position> ]? , |
    at <position> ,
  ]?
  <color-stop> [ , <color-stop> ]+
)
where <extent-keyword> = closest-corner | closest-side | farthest-corner | farthest-side
  and <color-stop>     = <color> [ <percentage> | <length> ]? 
```

径向渐变比线性渐变复杂一些，我们可以定义径向渐变的形状（circle和ellipse），渐变起始的位置（类似于background-position或者transform-origin）,渐变结束点位置（通过extend-keyword来决定的）以及渐变点（color-stop）。其中extend-keyword有四个选择值：

*closest-side*：径向渐变结束于离渐变圆心最近的应用径向渐变元素的边。

*closest-corner*： 径向渐变结束于应用径向渐变元素离渐变圆心最近的一个角的位置。

*farthest-side*:和closet-side相反，径向渐变结束于离圆心最远的一条边。

*farthest-corner*:和closest-corner相反，径向渐变结束语离圆心最远的一个角的位置。

**条纹**

![](http://p1.qqyou.com/pic/uploadpic/2012-6/2/2012060218055189584.jpg)

 在css中我们可以使用渐变来实现条纹，在线性渐变中，如果多个色标具有相同的位置，它们将产生一个无限小的过渡区域，过渡的起止色分别是第一个和最后一个指定值，从效果上看就是颜色在该点突然变化为下一个颜色点，而不是一个渐变效果，这一特定还适用于下一个颜色点的位置小于前一个颜色点的位置。正是因为这一特性，我们可以定义条纹状的渐变效果。

```css
background: linear-gradient(red 30%, blue 0);
background-size: 100% 30px;
```

![](http://content-management.b0.upaiyun.com/1473392448060.png)

可以看到上面的代码生成了水平状的条纹，红蓝相间，线性渐变我们省略了渐变方向，所以线性渐变使用默认值从上到下。background-size用来控制背景的大小，如果值是两个数字组成的，前面一个表示背景的宽度，后面一个值表示背景的高度。可以看到我们设置的30px。同时background-repeat是默认repeat的，因此我们最后的效果就是条纹背景在垂直方向上重复出现。

#### 2. CSS中的background属性

**background-image**

在CSS中，我们可以通过`background-image`属性来为元素设置一个或多个背景，这些背景图片通过堆砌的方式排列在`background-color`上方，内容的下方，先设置的`background-image`离用户最近，后设置`background-image`离用户越远。

元素的`border`是画在了`background-image`上面的，`background-image`的位置取决于`background-position`和`background-origin`下面我们将具体说明。

**background-position**

`background-position`CSS属性用来定义背景图片的位置，该位置相对于`background-origin`定义的位置层的。`background-origin`的默认值是padding-box。而`background-postion`的初始值是0% 0%。`background-origin`可以决定`background-position`定义的背景图片位置，其有三个值可选`border-box`、`padding-box`和`content-box`。这三个值很好理解，比如我们`background-position`初始值设置的为0% 0%，那么当`background-origin`的值为border-box时，背景图片从border-box开始绘制，如果设置的是padding-box，那么背景图片从padding-box开始绘制，如果设置的是content-box，那么背景图片从content-box开始绘制。

**background-repeat**

这个属性最好理解了，就是背景图片的重复方式，常用的取值有`repeat-x`、`repeat-y`、`repeat`、`space`和`round`和`no-repeat`。默认值是repeat。

#### 3. 通过CSS渐变和background属性实现切角效果

**常规切角**

我们已经知道，线性渐变可以做出条纹效果，那么我们是否也可以用线性渐变做出切角效果呢？答案是肯定的。

代码如下：

```css
.banner {
	width: 200px;
	height: 150px;
	margin-top: 100px;
	background: #58a;
	background: linear-gradient(135deg, transparent 15px, #58a 0) top left,
				linear-gradient(-135deg, transparent 15px, #58a 0) top right,
				linear-gradient(-45deg, transparent 15px, #58a 0) bottom right,
				linear-gradient(45deg, transparent 15px, #58a 0) bottom left;
	background-size: 50% 50%;
	background-repeat: no-repeat;
}
```

首先我们定义一个类名为banner的元素，设置其宽高，然后设置了四张背景图片，宽高都为50%。分别位于top left、top right、bottom right、bottom left。设置其repeat方式为no-repeat。

好了重点来了，在每张背景图片中，我们设置了一个渐变背景，起始颜色transparent，gradient-line角度为135deg，渐变长度为15px，其他的渐变色为`.banner`的背景色。由于条纹渐变，视觉上我们就看到了一个被切掉一角的元素。同时处理其他三个角，最后就得到了一个被切掉四个角的元素。

**弧形切角**

既然实现了切角元素，那么弧形切角也就很简单了，只用把线性渐变变成径向渐变就好了，代码实现如下：

```css
.arc {
	width: 200px;
	height: 150px;
	margin-top: 100px;
	background: #58a;
	background: radial-gradient(circle at top left, transparent 15px, #58a 0) top left,
				radial-gradient(circle at top right, transparent 15px, #58a 0) top right,
				radial-gradient(circle at bottom right, transparent 15px, #58a 0) bottom right,
				radial-gradient(circle at bottom left, transparent 15px, #58a 0) bottom left;
	background-size: 50% 50%;
	background-repeat: no-repeat;
}
```

这儿就不做解释了。

我们知道了切角的实现方式，那么文章开头的切角导航的实现也就顺理成章了，这儿就不再贴代码了，留作大家思考。





