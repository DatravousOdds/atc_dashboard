const { default: flatpickr } = require("flatpickr");


const configOptions = {
    mode: "range",
    dateFormat: "m-d-Y",
    showMonths: 2,
    onClose: function(selectedDates, dateStr, instance) {
        console.log("Selected dates:", selectedDates);
        console.log("Formatted date string:", dateStr);
    }
}

flatpickr(".date-range-calendar", configOptions);