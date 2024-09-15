document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    calculateRepayments();
});

function setupEventListeners() {
    const inputs = document.querySelectorAll('#principal, #annualRate, #loanTerm, #offsetBalance, #repaymentFrequency');
    inputs.forEach(input => input.addEventListener('change', calculateRepayments));
}

function calculateRepayments() {
    const principalInput = document.getElementById('principal');
    const annualRateInput = document.getElementById('annualRate');
    const loanTermInput = document.getElementById('loanTerm');
    const offsetBalanceInput = document.getElementById('offsetBalance');
    const repaymentFrequencyInput = document.getElementById('repaymentFrequency');

    const monthlyPaymentsDisplay = document.getElementById('monthlypayments');
    const interestSavedDisplay = document.getElementById('interestSaved');
    const timeSavedDisplay = document.getElementById('timeSaved');
    const revisedTimeDisplay = document.getElementById('revisedTime');

    const loanAmount = parseFloat(principalInput.value.replace(/[$,]/g, ''));
    const interestRate = parseFloat(annualRateInput.value.replace(/[%]/g, '')) / 100;
    const loanTerm = parseInt(loanTermInput.value.replace(/[^\d]/g, ''));
    let offsetBalance = parseFloat(offsetBalanceInput.value.replace(/[$,]/g, ''));
    const repaymentFrequency = repaymentFrequencyInput.value;

    const monthlyRate = interestRate / 12;
    const nPayments = loanTerm * 12;

    const monthlyRepayment = calculateMonthlyRepayment(loanAmount, monthlyRate, nPayments);

    // Initial calculations
    let remainingLoanBalance = loanAmount;
    let remainingAdjustedLoanBalance = loanAmount - offsetBalance;
    let totalInterestWithoutOffset = 0;
    let totalInterestWithOffset = 0;
    let offsetAdded = false;
    let monthsWithoutOffset = 0;
    let monthsWithOffset = 0;

    const loanBalanceWithoutOffset = [];
    const loanBalanceWithOffset = [];
    loanBalanceWithoutOffset.push(loanAmount)
    loanBalanceWithOffset.push(loanAmount)
    for (let month = 1; month <= nPayments; month++) {
        // Interest and principal for non-offset loan
        if (remainingLoanBalance > 0) {
            const interestForThisMonth = remainingLoanBalance * monthlyRate;
            const principalRepayment = Math.min(monthlyRepayment - interestForThisMonth, remainingLoanBalance);
            remainingLoanBalance -= principalRepayment;
            totalInterestWithoutOffset += interestForThisMonth;
            monthsWithoutOffset++;
            loanBalanceWithoutOffset.push(remainingLoanBalance);
        } else {
            loanBalanceWithoutOffset.push(0);
        }


        // Interest and principal for offset loan
        if (remainingAdjustedLoanBalance > 0) {
            let adjustedInterestForThisMonth = 0;
            if (!offsetAdded) {
                adjustedInterestForThisMonth = remainingAdjustedLoanBalance * monthlyRate;
            }
            const adjustedPrincipalRepayment = Math.min(monthlyRepayment - adjustedInterestForThisMonth, remainingAdjustedLoanBalance);
            remainingAdjustedLoanBalance -= adjustedPrincipalRepayment;
            totalInterestWithOffset += adjustedInterestForThisMonth;
            monthsWithOffset++;

            // Check if remainingAdjustedLoanBalance is less than or equal to 0 and add offset balance if applicable
            if (remainingAdjustedLoanBalance < monthlyRepayment && offsetBalance > 0) {
                remainingAdjustedLoanBalance += offsetBalance;
                offsetBalance = 0; // Assume all offset balance is used once added
                offsetAdded = true; // Set flag to true to stop interest calculation
                adjustedInterestForThisMonth = 0; // No interest paid after adding offset balance
                loanBalanceWithOffset.push(remainingAdjustedLoanBalance + offsetBalance);
                continue; // Skip to next iteration to deduct repayment from updated balance
            }
            loanBalanceWithOffset.push(remainingAdjustedLoanBalance + offsetBalance);
        } else {
            loanBalanceWithOffset.push(0);
        }

        // Log remaining loan balances for each month
        console.log(`Month ${month}: Total Amount Left Without Offset: ${remainingLoanBalance.toFixed(2)}`);
        console.log(`Month ${month}: Total Amount Left With Offset: ${remainingAdjustedLoanBalance.toFixed(2)}`);

        // Check if both loans are fully repaid
        if (remainingLoanBalance <= 0 && remainingAdjustedLoanBalance <= 0) {
            break;
        }
    }

    // If there is any remaining balance in the offset account, pay it back in additional months
    let extraMonth = 1;
    while (remainingAdjustedLoanBalance > 0) {
        const adjustedPrincipalRepayment = Math.min(monthlyRepayment, remainingAdjustedLoanBalance);
        remainingAdjustedLoanBalance -= adjustedPrincipalRepayment;
        monthsWithOffset++;

        // Log remaining loan balance for extra months
        console.log(`Extra Month ${extraMonth}: Total Amount Left With Offset: ${remainingAdjustedLoanBalance.toFixed(2)}`);
        extraMonth++;
    }

    // Calculate total interest saved
    const interestSaved = totalInterestWithoutOffset - totalInterestWithOffset;

    // Display results
    monthlyPaymentsDisplay.textContent = `$${monthlyRepayment.toFixed(2)}`;
    interestSavedDisplay.textContent = `$${interestSaved.toFixed(2)}`;
    monthsSaved = monthsWithoutOffset - monthsWithOffset
    timeSavedDisplay.textContent = `${Math.floor((monthsSaved) / 12)} ${Math.floor((monthsSaved) / 12) === 1 ? 'year' : 'years'}, ${monthsSaved % 12} ${monthsSaved % 12 === 1 ? 'month' : 'months'}`;
    revisedTimeDisplay.textContent = `${Math.floor(monthsWithOffset / 12)} ${Math.floor(monthsWithOffset / 12) === 1 ? 'year' : 'years'}, ${monthsWithOffset % 12} ${monthsWithOffset % 12 === 1 ? 'month' : 'months'}`;



    displayChart(loanBalanceWithoutOffset, loanBalanceWithOffset, loanTerm);
    //displayChart(loanAmount, totalInterestWithoutOffset, loanAmount - interestSaved, totalInterestWithOffset, loanTerm);
    displayYearlyValues(loanAmount, loanAmount - interestSaved, monthlyRepayment, monthlyRepayment, monthlyRate, loanTerm);
}

function calculateMonthlyRepayment(loanAmount, monthlyRate, nPayments) {
    return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nPayments));
}

function calculateTotalInterest(principal, monthlyRate, monthlyRepayment, nPayments) {
    let totalInterest = 0;
    let remainingBalance = principal;

    for (let i = 0; i < nPayments; i++) {
        const interestForThisMonth = remainingBalance * monthlyRate;
        totalInterest += interestForThisMonth;
        const principalRepayment = monthlyRepayment - interestForThisMonth;
        remainingBalance -= principalRepayment;

        if (remainingBalance <= 0) break;
    }

    return totalInterest;
}

function calculateAdjustedLoanTerm(adjustedLoanAmount, monthlyRate, monthlyRepayment) {
    if (adjustedLoanAmount <= 0) return 0;
    return Math.log((monthlyRepayment / monthlyRate) / ((monthlyRepayment / monthlyRate) - adjustedLoanAmount)) / Math.log(1 + monthlyRate) / 12;
}

function displayChart(loanBalanceWithoutOffset, loanBalanceWithOffset, loanTerm) {
    const ctx = document.getElementById('loanBalanceChart').getContext('2d');
    if (window.loanBalanceChart instanceof Chart) {
        window.loanBalanceChart.destroy();
    }

    // Generate labels for each year
    const labels = Array.from({ length: Math.ceil(loanBalanceWithoutOffset.length / 12) + 1 }, (_, i) => i); // Years on x-axis

    // Filter data for yearly balances, starting with the initial loan amount
    const yearlyBalanceWithoutOffset = [loanBalanceWithoutOffset[0]];
    const yearlyBalanceWithOffset = [loanBalanceWithOffset[0]];

    for (let i = 1; i <= loanTerm; i++) {
        yearlyBalanceWithoutOffset.push(loanBalanceWithoutOffset[(i * 12)] || 0);
        yearlyBalanceWithOffset.push(loanBalanceWithOffset[(i * 12)] || 0);
    }

    // Ensure the first value is the initial loan amount
    yearlyBalanceWithoutOffset[0] = loanBalanceWithoutOffset[0];
    yearlyBalanceWithOffset[0] = loanBalanceWithOffset[0];

    window.loanBalanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Payment',
                    data: yearlyBalanceWithoutOffset,
                    backgroundColor: 'rgba(211, 211, 211, 0.2)',
                    borderColor: 'rgba(128, 128, 128, 1)',
                    fill: true,
                    lineTension: .4,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Loan Balance',
                    data: yearlyBalanceWithOffset,
                    backgroundColor: 'rgba(60,190,216,0.2)',
                    borderColor: 'rgba(60,190,216,1)',
                    fill: true,
                    lineTension: .4,
                    borderWidth: 2,
                    pointRadius: 3

                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Years'
                    },
                    ticks: {
                        callback: function (value) {
                            return value; // Show only years
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount Owing ($)'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 6,
                        callback: function (value) {
                            return value <= 1000 ? `$${value.toFixed(0)}` : `$${(value / 1000).toFixed(0)}k`;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    usePointStyle: true,
                    callbacks: {
                        label: function (context) {
                            const amount = `$${Math.round(context.parsed.y).toLocaleString()}`;
                            const year = context.dataIndex;
                            return [`Amount: ${amount}`, `Year: ${year}`];
                        }
                    },
                    backgroundColor: function (context) {
                        const datasetIndex = context.tooltip.dataPoints[0].datasetIndex;
                        return context.chart.data.datasets[datasetIndex].borderColor;
                    },
                    borderColor: function (context) {
                        const datasetIndex = context.tooltip.dataPoints[0].datasetIndex;
                        return context.chart.data.datasets[datasetIndex].borderColor;
                    },
                    borderWidth: 1,
                    titleFont: { size: 0 },
                    titleMarginBottom: 0,
                }
            }

        }
    });
}


