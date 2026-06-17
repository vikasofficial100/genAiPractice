document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.btn[data-value]');
    const clearBtn = document.getElementById('clear');
    const equalsBtn = document.getElementById('equals');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            display.value += btn.getAttribute('data-value');
        });
    });

    clearBtn.addEventListener('click', () => {
        display.value = '';
    });

    equalsBtn.addEventListener('click', () => {
        try {
            // Evaluate the expression safely
            const result = eval(display.value);
            display.value = result;
        } catch (e) {
            display.value = 'Error';
        }
    });
});
