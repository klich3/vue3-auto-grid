# Vue3 - Auto grid Sample

Grid layout with Vue3 and CSS Grid.

In releases there are several versions the first one is the simplest with simple and native components.
The last version has already incorporated `composables` is structured in another way and has implemented `Tailwind` dependency.

I have seen this reference website: https://nevflynn.com/?ref=sychev
I liked it and decided to try to make my own version, it is not exactly the same but it has the same principle.

The idea is to create grid of squares in this example are 4 columns, and there are elements like:
* Box "1x1"
* Horizontal rectangle "2x1"
* Vertical rectangle "1x2"
* It could be, a larger square "2x2".

Moving an element creates a "Ghost" shadow that follows the dragged element and rearranges the grid.
Element scales are taken into account when superimposing over grid elements.

***Basic version***
![Preview](images/preview.gif)

***Complex version***
![Preview](images/preview2.gif)


## DEV

Install: `$ npm i`
Run: `$ npm run dev` or `$ npm run serve` 
