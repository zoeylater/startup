# CS 260 Notes

[My Notes](notes.md)

This file represents what I have learned about web programming.

"I love web programming" also I can add more md files within this (come back to this idea)

- [My startup](https://startup.cs260.click)
- [My simon](https://simon.cs260.click)
- [My Github](https://github.com/zoeylater/startup)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax SYNTAX FOR WRITING IN MARKDOWN!!!!!!!!

## AWS

Interesting things I have learned about AWS

## HTML

Interesting things I have learned about HTML

## React

Interesting things I have learned about React





> [!NOTE]
> This is a template for your startup application. You must modify this `README.md` file for each phase of your development. You only need to fill in the section for each deliverable when that deliverable is submitted in Canvas. Without completing the section for a deliverable, the TA will not know what to look for when grading your submission. Feel free to add additional information to each deliverable description, but make sure you at least have the list of rubric items and a description of what you did for each item.

> [!NOTE]
> If you are not familiar with Markdown then you should review the [documentation](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) before continuing.

> [!NOTE]
> Fill in this sections as the submission artifact for this deliverable. You can refer to this [example](https://github.com/webprogramming260/startup-example/blob/main/README.md) for inspiration.

w3.schools.com for a whole bunch of CSS, HTML help




# CSS HELPS
     In CSS Grid, the Parent-Child relationship describes how a container (the parent) controls the layout of the elements directly inside it (the children).

Grid Container (Parent): The element where you apply display: grid. It defines the rows, columns, and gaps.
Grid Items (Children): The direct nested elements. They automatically become "grid items" and follow the parent's rules.
Parent: .grid-container
Child: Grid Item 1
Child: Grid Item 2
Child: Grid Item 3
Code Example

<div class="parent"> <!-- The Container -->
  <div>Child 1</div> <!-- The Item -->
  <div>Child 2</div> <!-- The Item -->
</div>

.parent {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Parent defines 2 columns */
}

.parent > div {
  border: 1px solid black; /* Styles applied to children */
}


NEW DEPLOY FILE COMMAND: ./deployFiles.sh -k "/c/Users/zoeyl/OneDrive/Desktop/CS260/CS-260.pem" -h 54.234.8.94 -s simon


    try this sequence: 
    - cd /c/Users/zoeyl/OneDrive/Desktop/CS260/CS260/simon-css

    - sed -i 's/\r$//' deployFiles.sh

    - chmod +x deployFiles.sh

    - ./deployFiles.sh -k "/c/Users/zoeyl/OneDrive/Desktop/CS260/CS-260.pem" -h 54.234.8.94 -s simon

OR::: sed -i 's/\r$//' deployFiles.sh && chmod +x deployFiles.sh && ./deployFiles.sh -k "/c/Users/zoeyl/OneDrive/Desktop/CS260/CS-260.pem" -h 54.234.8.94 -s startup