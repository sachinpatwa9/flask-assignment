// Version 1 - simple and easy to understand
// This is the basic way to write JavaScript.
// It works step by step and is easier for beginners.

function versionOne() {
    const name = 'World';
    const message = 'Hello, ' + name + '!';
    console.log(message);
    alert(message);
}

// Version 2 - cleaner and more organized
// This version uses functions and DOM checks so it is easier to maintain.

function showGreeting() {
    const nameInput = document.getElementById('name');
    const greetingText = document.getElementById('greeting');

    const name = nameInput ? nameInput.value.trim() : '';
    const finalName = name || 'World';
    const message = 'Hello, ' + finalName + '!';

    if (greetingText) {
        greetingText.textContent = message;
    } else {
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('greet-btn');

    if (button) {
        button.addEventListener('click', showGreeting);
    }
});

/*
    How to read this file:
    1. Version 1 is the direct and simple style.
    2. Version 2 is the cleaner style used in real projects.

    Example usage in HTML:
    <input id="name" type="text" placeholder="Enter your name">
    <button id="greet-btn">Say Hello</button>
    <p id="greeting"></p>
*/
