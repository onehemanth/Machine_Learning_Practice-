const fields = [
  { key: 'vendorCustomerName', label: 'Vendor/Customer Name', manual: false },
  { key: 'companyCode', label: 'Company code', manual: true },
  { key: 'natureOfService', label: 'Nature of service / work done by vendor', manual: true },
  { key: 'accountGroup', label: 'Account Group', manual: true },
  { key: 'address', label: 'Address', manual: false },
  { key: 'city', label: 'City', manual: false },
  { key: 'pinCode', label: 'Pin Code', manual: false },
  { key: 'state', label: 'State', manual: false },
  { key: 'country', label: 'Country', manual: false },
  { key: 'telephone1', label: 'Telephone No 1', manual: false },
  { key: 'mobile', label: 'Mobile', manual: false },
  { key: 'email', label: 'E Mail address', manual: false },
  { key: 'bankName', label: 'Bank Name', manual: false },
  { key: 'bankAccountNo', label: 'Bank Account No', manual: false },
  { key: 'accountHolderName', label: 'Account Holder Name', manual: false },
  { key: 'bankBranchAddress', label: 'Bank Branch Address', manual: false },
  { key: 'bankCity', label: 'Bank City', manual: false },
  { key: 'ifsc', label: "IFSC (RTGS) Code Number", manual: false },
  { key: 'pan', label: 'PAN No', manual: false },
  { key: 'dobOrIncorporationDate', label: 'Date of Incorporation / Birth (DD-MMM-YYYY)', manual: false },
  { key: 'gstin', label: 'GSTIN No', manual: false },
  { key: 'msmeRegistrationNo', label: 'MSME Registration Number', manual: false },
  { key: 'msmeLatestFy', label: 'MSME Registration latest available FY', manual: false }
];

const patterns = {
  gstin: /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}\b/g,
  pan: /\b[A-Z]{5}\d{4}[A-Z]{1}\b/g,
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  mobile: /(?<!\d)(?:\+?91[-\s]?)?[6-9]\d{9}(?!\d)/g,
  pinCode: /\b\d{6}\b/g,
  bankAccountNo: /\b\d{9,18}\b/g,
  date: /\b(?:\d{2}[-\/]?[A-Za-z]{3}[-\/]?\d{4}|\d{2}[-\/]\d{2}[-\/]\d{4})\b/g,
  msmeRegistrationNo: /\b(?:UDYAM|UAM)[-\s]?[A-Z]{2}[-\s]?\d{2}[-\s]?\d{7}\b/gi,
  telephone1: /(?<!\d)0\d{2,4}[-\s]?\d{6,8}(?!\d)/g
};

const manualDefaults = {
  country: 'India'
};

let latestCsv = '';

function buildForm() {
  const form = document.getElementById('kycForm');
  form.innerHTML = '';

  fields.forEach((f) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'field';

    const label = document.createElement('label');
    label.setAttribute('for', f.key);
    label.innerHTML = `${f.label}${f.manual ? ' <span class="required-manual">(Fill manually)</span>' : ''}`;

    const input = document.createElement('input');
    input.id = f.key;
    input.name = f.key;
    input.value = manualDefaults[f.key] ?? '';

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });
}

function getFirstMatch(pattern, text) {
  const matches = text.match(pattern);
  return matches?.[0] ?? '';
}

function extractByNearbyLabel(labelKeywords, text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (labelKeywords.some((kw) => lower.includes(kw))) {
      const parts = line.split(/[:\-]/);
      if (parts.length > 1 && parts.slice(1).join(' ').trim().length > 1) {
        return parts.slice(1).join(' ').trim();
      }
    }
  }
  return '';
}

function parseDocumentText(text) {
  const valueMap = {
    gstin: getFirstMatch(patterns.gstin, text),
    pan: getFirstMatch(patterns.pan, text),
    ifsc: getFirstMatch(patterns.ifsc, text),
    email: getFirstMatch(patterns.email, text),
    mobile: getFirstMatch(patterns.mobile, text),
    pinCode: getFirstMatch(patterns.pinCode, text),
    bankAccountNo: getFirstMatch(patterns.bankAccountNo, text),
    dobOrIncorporationDate: getFirstMatch(patterns.date, text),
    msmeRegistrationNo: getFirstMatch(patterns.msmeRegistrationNo, text),
    telephone1: getFirstMatch(patterns.telephone1, text),
    vendorCustomerName: extractByNearbyLabel(['name of enterprise', 'name', 'vendor name', 'customer name'], text),
    address: extractByNearbyLabel(['address'], text),
    city: extractByNearbyLabel(['city', 'town'], text),
    state: extractByNearbyLabel(['state'], text),
    bankName: extractByNearbyLabel(['bank name'], text),
    accountHolderName: extractByNearbyLabel(['account holder', 'beneficiary name'], text),
    bankBranchAddress: extractByNearbyLabel(['branch address'], text),
    bankCity: extractByNearbyLabel(['branch city', 'bank city'], text),
    msmeLatestFy: extractByNearbyLabel(['financial year', 'fy'], text)
  };

  Object.entries(valueMap).forEach(([key, value]) => {
    const input = document.getElementById(key);
    if (input && value && !input.value.trim()) {
      input.value = value;
    }
  });
}

async function extractTextFromPdf(file) {
  const status = document.getElementById('status');
  status.textContent = 'Reading PDF...';

  const arrBuffer = await file.arrayBuffer();
  const pdfjsLib = globalThis.pdfjsLib;
  const pdf = await pdfjsLib.getDocument({ data: arrBuffer }).promise;

  let allText = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(' ');
    allText += `\n${text}`;
  }

  status.textContent = `Extracted text from ${pdf.numPages} page(s). Please verify every field before submit.`;
  return allText;
}

function collectFormData() {
  const data = {};
  fields.forEach((f) => {
    const input = document.getElementById(f.key);
    data[f.label] = input?.value?.trim() ?? '';
  });
  return data;
}

function renderTable(rowData) {
  const thead = document.querySelector('#outputTable thead');
  const tbody = document.querySelector('#outputTable tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  const headerRow = document.createElement('tr');
  Object.keys(rowData).forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const row = document.createElement('tr');
  Object.values(rowData).forEach((value) => {
    const td = document.createElement('td');
    td.textContent = value;
    row.appendChild(td);
  });
  tbody.appendChild(row);
}

function escapeCsvValue(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function toCsv(rowData) {
  const headers = Object.keys(rowData);
  const values = Object.values(rowData).map((v) => escapeCsvValue(v ?? ''));
  return `${headers.join(',')}\n${values.join(',')}\n`;
}

function downloadCsv(content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'vendor_kyc_details.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function init() {
  buildForm();

  document.getElementById('extractBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('pdfFile');
    const status = document.getElementById('status');

    if (!fileInput.files?.length) {
      status.textContent = 'Please choose a PDF first.';
      return;
    }

    try {
      const text = await extractTextFromPdf(fileInput.files[0]);
      parseDocumentText(text);
    } catch (error) {
      status.textContent = `Extraction failed. Use text-based PDF. Error: ${error.message}`;
    }
  });

  document.getElementById('submitBtn').addEventListener('click', () => {
    const data = collectFormData();
    renderTable(data);
    latestCsv = toCsv(data);
    document.getElementById('downloadBtn').disabled = false;
  });

  document.getElementById('downloadBtn').addEventListener('click', () => {
    if (latestCsv) {
      downloadCsv(latestCsv);
    }
  });
}

init();
