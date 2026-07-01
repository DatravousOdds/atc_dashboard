
const element = document.querySelector('#workOrderDetails');

console.log('Element exists:', !!element);
console.log('Element visible:', element?.offsetHeight);



const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
});

const configOptions = {
    mode: "range",
    dateFormat: "m-d-Y",
    showMonths: 2,
    inline: true,
    onChange: function(selectedDates, dateStr, instance) {
        const [startDate, endDate] = dateStr.split(" to ");
        console.log("Selected Start Date:", startDate);
        console.log("Selected End Date:", endDate);

        if (!startDate || !endDate) {
            console.warn("Please select both start and end dates.");
            return;
        };

        const dateRange = {
            start: dateFormatter.format(new Date(startDate.replace(/-/g, "/"))),
            end: dateFormatter.format(new Date(endDate.replace(/-/g, "/")))
        };
        console.log("Date Range:", dateRange);
        const scheduleStartValue = document.getElementById("scheduleStartValue");
        const scheduleEndValue = document.getElementById("scheduleEndValue");
        if (scheduleStartValue && scheduleEndValue) {
            scheduleStartValue.textContent = dateRange.start;
            scheduleEndValue.textContent = dateRange.end;
        } else {
            console.warn("Schedule start or end input elements not found.");
        }
    }
};

// Exposed on window since workOrders.js runs as a separate module scope and needs
// to call .clear() on this instance when the work order form is reset/cancelled.
window.workOrderDateRangePicker = flatpickr(".date-range-calendar", configOptions);