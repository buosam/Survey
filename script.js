// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Firebase configuration from Flask
const firebaseConfig = JSON.parse(document.getElementById('firebase-config').textContent);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const companyInput = document.getElementById('company');
const companyRating = document.getElementById('companyRating');
const ratingRadios = document.querySelectorAll('input[name="rating"]');
const ratingText = document.getElementById('ratingText');
const currencySelect = document.getElementById('currency');
const salaryInput = document.getElementById('salary');
const salaryError = document.getElementById('salaryError');
const amountInWords = document.getElementById('amountInWords');
const submitSpinner = document.getElementById('submitSpinner');
const searchSpinner = document.getElementById('searchSpinner');
const submitButton = document.getElementById('submitButton');
const privacyModal = document.getElementById('privacyModal');
const privacyLink = document.getElementById('privacyLink');
const closeModal = document.getElementById('closeModal');

// Throttling variables
let lastSubmissionTime = 0;
const SUBMISSION_THROTTLE_TIME = 5000; // 5 seconds

// Rating text mapping
const ratingLabels = {
    '1': 'Poor',
    '2': 'Fair',
    '3': 'Average',
    '4': 'Good',
    '5': 'Excellent'
};

// Exchange rate for currency conversion
const EXCHANGE_RATE = 1450; // 1 USD = 1450 IQD

// Show/hide company rating based on company name input
companyInput.addEventListener('input', function() {
    if (this.value.trim() !== '') {
        companyRating.style.display = 'block';
    } else {
        companyRating.style.display = 'none';
        ratingRadios.forEach(radio => radio.checked = false);
        ratingText.textContent = 'Select a rating';
    }
});

// Update rating text and star colors
ratingRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        ratingText.textContent = ratingLabels[this.value];
        const selectedValue = parseInt(this.value);
        
        document.querySelectorAll('.star-rating label').forEach(label => {
            label.style.color = '#ccc';
        });
        
        for (let i = 1; i <= selectedValue; i++) {
            document.querySelector(`.star-rating label[for="star${i}"]`).style.color = '#ffc107';
        }
    });
});

// Privacy policy modal
privacyLink.addEventListener('click', function(e) {
    e.preventDefault();
    privacyModal.style.display = 'flex';
});

closeModal.addEventListener('click', function() {
    privacyModal.style.display = 'none';
});

window.addEventListener('click', function(e) {
    if (e.target === privacyModal) {
        privacyModal.style.display = 'none';
    }
});

// Update currency symbol
currencySelect.addEventListener('change', function() {
    const symbol = this.value === 'IQD' ? 'IQD' : '$';
    document.querySelector('.currency-symbol').textContent = symbol;
    validateSalary();
});

// Salary validation and amount in words
salaryInput.addEventListener('input', validateSalary);

function validateSalary() {
    const currency = currencySelect.value;
    const salary = parseInt(salaryInput.value);
    
    salaryError.style.display = 'none';
    amountInWords.textContent = '';
    
    if (!currency) return;
    if (isNaN(salary)) return;
    
    if (currency === 'USD') {
        if (salary < 300) {
            showError('Minimum USD salary is $300');
        } else if (salary > 50000) {
            showError('Maximum USD salary is $50,000');
        } else {
            amountInWords.textContent = numberToWords(salary) + ' US Dollars';
        }
    } else if (currency === 'IQD') {
        if (salary < 350000) {
            showError('Minimum IQD salary is 350,000 IQD');
        } else if (salary > 70000000) {
            showError('Maximum IQD salary is 70,000,000 IQD');
        } else {
            amountInWords.textContent = numberToWords(salary) + ' Iraqi Dinars';
        }
    }
    
    function showError(message) {
        salaryError.textContent = message;
        salaryError.style.display = 'block';
    }
}

// Number to words conversion
function numberToWords(num) {
    if (num === 0) return 'zero';
    
    const units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const thousands = ['', 'thousand', 'million'];
    
    function convertChunk(chunk) {
        let result = '';
        const hundreds = Math.floor(chunk / 100);
        const remainder = chunk % 100;
        
        if (hundreds) {
            result += units[hundreds] + ' hundred ';
        }
        
        if (remainder < 10) {
            result += units[remainder];
        } else if (remainder < 20) {
            result += teens[remainder - 10];
        } else {
            const ten = Math.floor(remainder / 10);
            const unit = remainder % 10;
            result += tens[ten] + (unit ? '-' + units[unit] : '');
        }
        
        return result.trim();
    }
    
    let words = '';
    let chunkIndex = 0;
    
    while (num > 0) {
        const chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = convertChunk(chunk);
            if (thousands[chunkIndex]) {
                chunkWords += ' ' + thousands[chunkIndex];
            }
            words = chunkWords + (words ? ' ' + words : '');
        }
        num = Math.floor(num / 1000);
        chunkIndex++;
    }
    
    return words;
}

// Input sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Add benefit functionality
document.getElementById('addBenefit').addEventListener('click', function() {
    const benefitsContainer = this.previousElementSibling;
    const newBenefit = document.createElement('label');
    newBenefit.style.display = 'flex';
    newBenefit.style.alignItems = 'center';
    newBenefit.style.gap = '10px';
    newBenefit.style.marginTop = '10px';
    newBenefit.innerHTML = `
        <input type="checkbox" name="benefits" value="custom" checked>
        <input type="text" placeholder="Enter benefit name" style="width: 80%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
    `;
    benefitsContainer.appendChild(newBenefit);
});

// Form submission
document.getElementById('salaryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const currentTime = new Date().getTime();
    if (currentTime - lastSubmissionTime < SUBMISSION_THROTTLE_TIME) {
        alert('Please wait a moment before submitting again.');
        return;
    }
    lastSubmissionTime = currentTime;
    
    submitButton.disabled = true;
    
    const currency = currencySelect.value;
    const salary = parseInt(salaryInput.value);
    let valid = true;
    
    if (currency === 'USD' && (salary < 300 || salary > 50000)) {
        valid = false;
    } else if (currency === 'IQD' && (salary < 350000 || salary > 70000000)) {
        valid = false;
    }
    
    if (!valid) {
        salaryError.textContent = 'Please enter a valid salary amount';
        salaryError.style.display = 'block';
        salaryInput.focus();
        submitButton.disabled = false;
        return;
    }
    
    submitSpinner.style.display = 'inline-block';
    
    const formData = {
        company: companyInput.value || "Anonymous",
        jobTitle: document.getElementById('jobTitle').value,
        currency: currency,
        salary: salary,
        benefits: Array.from(document.querySelectorAll('input[name="benefits"]:checked')).map(cb => {
            if (cb.value === "custom") {
                const textInput = cb.nextElementSibling;
                return textInput.value.trim();
            }
            return cb.value;
        }).filter(val => val),
        notes: document.getElementById('notes').value || "No additional notes",
        industry: document.getElementById('industry').value,
        experience: document.getElementById('experience').value,
        location: document.getElementById('location').value,
        companySize: document.getElementById('companySize').value || "Not specified",
        jobTitleLower: document.getElementById('jobTitle').value.toLowerCase(),
        timestamp: new Date().toISOString()
    };
    
    const selectedRating = document.querySelector('input[name="rating"]:checked');
    if (selectedRating) {
        formData.companyRating = parseInt(selectedRating.value);
    }
    
    formData.company = sanitizeInput(formData.company);
    formData.jobTitle = sanitizeInput(formData.jobTitle);
    formData.notes = sanitizeInput(formData.notes);
    formData.benefits = formData.benefits.map(benefit => sanitizeInput(benefit));
    formData.jobTitleLower = sanitizeInput(formData.jobTitleLower);
    
    try {
        const docRef = await addDoc(collection(db, "salaries"), formData);
        console.log("Document written with ID: ", docRef.id);
        
        document.querySelector('.form-container').style.display = 'none';
        document.getElementById('thankYouMessage').style.display = 'block';
        
        const countElement = document.getElementById('submissionCount');
        const currentCount = parseInt(countElement.textContent.replace(/[^0-9]/g, ''));
        countElement.textContent = (currentCount + 1).toLocaleString() + '+';

        document.getElementById('searchJobTitle').value = formData.jobTitle;
        document.getElementById('searchButton').click();
    } catch (error) {
        console.error("Error saving data: ", error);
        alert("There was an error submitting your data. Please try again.");
    } finally {
        submitSpinner.style.display = 'none';
        setTimeout(() => {
            submitButton.disabled = false;
        }, SUBMISSION_THROTTLE_TIME);
    }
});

// Search functionality
document.getElementById('searchButton').addEventListener('click', async function() {
    const jobTitle = document.getElementById('searchJobTitle').value.trim();
    if (!jobTitle) return;
    
    searchSpinner.style.display = 'inline-block';
    
    const resultsElement = document.getElementById('searchResults');
    const titleElement = document.getElementById('resultTitle');
    const averageElement = document.getElementById('resultAverage');
    const conversionElement = document.getElementById('resultConversion');
    const countElement = document.getElementById('resultCount');
    
    titleElement.textContent = '';
    averageElement.textContent = '';
    conversionElement.textContent = '';
    countElement.textContent = '';
    
    try {
        const q = query(collection(db, "salaries"), 
            where("jobTitleLower", ">=", jobTitle.toLowerCase()), 
            where("jobTitleLower", "<=", jobTitle.toLowerCase() + '\uf8ff'));
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.size < 3) {
            titleElement.textContent = `Results for: ${jobTitle}`;
            averageElement.textContent = `We don't have enough data for this job title yet.`;
            countElement.textContent = `Only ${querySnapshot.size} submission(s) found.`;
            resultsElement.style.display = 'block';
            return;
        }

        let totalUSD = 0;
        let totalIQD = 0;
        let usdCount = 0;
        let iqdCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.currency === 'USD') {
                totalUSD += data.salary;
                usdCount++;
            } else if (data.currency === 'IQD') {
                totalIQD += data.salary;
                iqdCount++;
            }
        });

        const avgUSD = usdCount > 0 ? Math.round(totalUSD / usdCount) : 0;
        const avgIQD = iqdCount > 0 ? Math.round(totalIQD / iqdCount) : 0;

        titleElement.textContent = `Results for: ${jobTitle}`;
        
        if (avgUSD > 0 && avgIQD > 0) {
            averageElement.textContent = `Average Salary: $${avgUSD.toLocaleString()} USD / ${avgIQD.toLocaleString()} IQD`;
            conversionElement.innerHTML = `
                <span class="conversion-rate">Currency Conversion:</span> 
                $${avgUSD.toLocaleString()} USD ≈ ${(avgUSD * EXCHANGE_RATE).toLocaleString()} IQD<br>
                ${avgIQD.toLocaleString()} IQD ≈ ${(avgIQD / EXCHANGE_RATE).toFixed(0)} USD 
                <span style="font-size:0.8em">(1 USD = ${EXCHANGE_RATE} IQD)</span>
            `;
        } else if (avgUSD > 0) {
            averageElement.textContent = `Average Salary: $${avgUSD.toLocaleString()} USD`;
            conversionElement.innerHTML = `
                <span class="conversion-rate">Approximate Conversion:</span> 
                $${avgUSD.toLocaleString()} USD ≈ ${(avgUSD * EXCHANGE_RATE).toLocaleString()} IQD 
                <span style="font-size:0.8em">(1 USD = ${EXCHANGE_RATE} IQD)</span>
            `;
        } else if (avgIQD > 0) {
            averageElement.textContent = `Average Salary: ${avgIQD.toLocaleString()} IQD`;
            conversionElement.innerHTML = `
                <span class="conversion-rate">Approximate Conversion:</span> 
                ${avgIQD.toLocaleString()} IQD ≈ ${(avgIQD / EXCHANGE_RATE).toFixed(0)} USD 
                <span style="font-size:0.8em">(1 USD = ${EXCHANGE_RATE} IQD)</span>
            `;
        } else {
            averageElement.textContent = `No salary data available`;
        }
        
        countElement.textContent = `Based on ${querySnapshot.size} submissions`;
        resultsElement.style.display = 'block';

    } catch (error) {
        console.error("Error searching data: ", error);
        titleElement.textContent = `Error`;
        averageElement.textContent = `There was an error retrieving salary data.`;
        resultsElement.style.display = 'block';
    } finally {
        searchSpinner.style.display = 'none';
    }
});

// Auto-increment submission count during 8AM-1AM
function startAutoIncrementTimer() {
    function incrementCount() {
        const now = new Date();
        const hours = now.getHours();
        
        if (hours >= 8 || hours < 1) {
            const countElement = document.getElementById('submissionCount');
            const currentCount = parseInt(countElement.textContent.replace(/[^0-9]/g, ''));
            countElement.textContent = (currentCount + 1).toLocaleString() + '+';
        }
    }

    incrementCount();
    setInterval(incrementCount, 300000);
}

startAutoIncrementTimer();