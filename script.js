// عنوان الخادم
const API_BASE_URL = 'http://localhost:8080/api';

// متغيرات عامة
let booksChart = null;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة وضع الظلام/الفاتح
    initTheme();
    
    // تهيئة التنقل بين الأقسام
    initNavigation();
    
    // تحميل البيانات الأولية
    loadInitialData();
    
    // إعداد المستمعين للأحداث
    setupEventListeners();
    
    // إعداد البحث
    setupSearch();
});

// تهيئة وضع الظلام/الفاتح
function initTheme() {
    const toggleSwitch = document.querySelector('#checkbox');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleSwitch.checked = true;
    }
    
    toggleSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}

// تهيئة التنقل بين الأقسام
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.dataset.section;
            
            // تحديث القائمة النشطة
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // إظهار القسم المطلوب
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                    
                    // تحميل بيانات إضافية حسب القسم
                    if (sectionId === 'stats') {
                        loadStatistics();
                        loadRecentTransactions();
                    }
                }
            });
        });
    });
}

// تحميل البيانات الأولية
function loadInitialData() {
    loadBooksList();
    updateDashboardStats();
}

// إعداد المستمعين للأحداث
function setupEventListeners() {
    // نموذج إضافة كتاب
    document.getElementById('addBookForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const bookId = document.getElementById('bookId').value;
        
        const messageDiv = document.getElementById('addMessage');
        
        try {
            const response = await fetch(`${API_BASE_URL}/books/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, author, bookID: parseInt(bookId) })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, data.message, 'success');
                this.reset();
                loadBooksList();
                updateDashboardStats();
                loadStatistics();
            } else {
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'خطأ في الاتصال بالخادم', 'error');
        }
    });
    
    // زر البحث عن كتاب للتعديل
    document.getElementById('findBookBtn').addEventListener('click', async function() {
        const bookId = document.getElementById('editBookId').value;
        const bookDetails = document.getElementById('bookDetails');
        const messageDiv = document.getElementById('editMessage');
        
        if (!bookId) {
            showMessage(messageDiv, 'الرجاء إدخال رقم الكتاب', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/books/list`);
            const books = await response.json();
            
            const book = books.find(b => b.BookID === parseInt(bookId));
            
            if (book) {
                document.getElementById('editBookTitle').value = book.Title;
                document.getElementById('editBookAuthor').value = book.Author;
                bookDetails.style.display = 'block';
                showMessage(messageDiv, 'تم العثور على الكتاب', 'success');
            } else {
                bookDetails.style.display = 'none';
                showMessage(messageDiv, 'لم يتم العثور على الكتاب', 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'خطأ في الاتصال بالخادم', 'error');
        }
    });
    
    // نموذج تعديل كتاب
    document.getElementById('editBookForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const bookId = document.getElementById('editBookId').value;
        const newTitle = document.getElementById('editBookTitle').value;
        const newAuthor = document.getElementById('editBookAuthor').value;
        
        const messageDiv = document.getElementById('editMessage');
        
        try {
            const response = await fetch(`${API_BASE_URL}/books/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bookID: parseInt(bookId), 
                    newTitle, 
                    newAuthor 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, data.message, 'success');
                this.reset();
                document.getElementById('bookDetails').style.display = 'none';
                loadBooksList();
                updateDashboardStats();
                loadStatistics();
            } else {
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'خطأ في الاتصال بالخادم', 'error');
        }
    });
    
    // نموذج استعارة كتاب
    document.getElementById('borrowForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const bookId = document.getElementById('borrowBookId').value;
        const messageDiv = document.getElementById('borrowMessage');
        
        try {
            const response = await fetch(`${API_BASE_URL}/books/borrow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookID: parseInt(bookId) })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, data.message, 'success');
                this.reset();
                loadBooksList();
                updateDashboardStats();
                loadStatistics();
                loadRecentTransactions();
            } else {
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'خطأ في الاتصال بالخادم', 'error');
        }
    });
    
    // نموذج إرجاع كتاب
    document.getElementById('returnForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const bookId = document.getElementById('returnBookId').value;
        const messageDiv = document.getElementById('returnMessage');
        
        try {
            const response = await fetch(`${API_BASE_URL}/books/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookID: parseInt(bookId) })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, data.message, 'success');
                this.reset();
                loadBooksList();
                updateDashboardStats();
                loadStatistics();
                loadRecentTransactions();
            } else {
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'خطأ في الاتصال بالخادم', 'error');
        }
    });
    
    // نموذج حذف كتاب
    document.getElementById('deleteBookForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const bookId = document.getElementById('deleteBookId').value;
        const messageDiv = document.getElementById('deleteMessage');
        
        if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/books/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookID: parseInt(bookId) })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showMessage(messageDiv, data.message, 'success');
                this.reset();
                loadBooksList();
                updateDashboardStats();
                loadStatistics();
                loadRecentTransactions();
            } else {
                showMessage(messageDiv, data.message, 'error');
            }
        } catch (error) {
            showMessage(messageDiv, 'خطأ في الاتصال بالخادم', 'error');
        }
    });
}

// إعداد البحث
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// تنفيذ البحث
async function performSearch() {
    const query = document.getElementById('searchInput').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(query)}`);
        const books = await response.json();
        
        // تحويل إلى قسم الرئيسية
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelector('.nav-item[data-section="dashboard"]').classList.add('active');
        
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.getElementById('dashboard').classList.add('active');
        
        // عرض نتائج البحث
        displayBooks(books);
    } catch (error) {
        console.error('Error searching books:', error);
    }
}

// تحميل قائمة الكتب
async function loadBooksList() {
    try {
        const response = await fetch(`${API_BASE_URL}/books/list`);
        const books = await response.json();
        
        displayBooks(books);
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

// عرض الكتب في الجدول
function displayBooks(books) {
    const tbody = document.getElementById('booksTableBody');
    tbody.innerHTML = '';
    
    books.forEach(book => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${book.BookID}</td>
            <td>${book.Title}</td>
            <td>${book.Author}</td>
            <td><span class="status ${book.Status === 'Available' ? 'available' : 'borrowed'}">${book.Status === 'Available' ? 'متاح' : 'مستعار'}</span></td>
            <td>
                <button class="action-btn btn-edit" onclick="editBook(${book.BookID})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                ${book.Status === 'Available' ? 
                    `<button class="action-btn btn-borrow" onclick="borrowBook(${book.BookID})">
                        <i class="fas fa-handshake"></i> استعارة
                    </button>` : 
                    `<button class="action-btn btn-return" onclick="returnBook(${book.BookID})">
                        <i class="fas fa-undo"></i> إرجاع
                    </button>`
                }
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// تحديث إحصائيات لوحة التحكم
async function updateDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/books/list`);
        const books = await response.json();
        
        const totalBooks = books.length;
        const availableBooks = books.filter(b => b.Status === 'Available').length;
        const borrowedBooks = books.filter(b => b.Status === 'Borrowed').length;
        
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('availableBooks').textContent = availableBooks;
        document.getElementById('borrowedBooks').textContent = borrowedBooks;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// تحميل الإحصائيات والرسم البياني
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/books/list`);
        const books = await response.json();
        
        const availableBooks = books.filter(b => b.Status === 'Available').length;
        const borrowedBooks = books.filter(b => b.Status === 'Borrowed').length;
        
        // إنشاء/تحديث الرسم البياني
        const ctx = document.getElementById('booksChart').getContext('2d');
        
        if (booksChart) {
            booksChart.destroy();
        }
        
        booksChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['كتب متاحة', 'كتب مستعارة'],
                datasets: [{
                    data: [availableBooks, borrowedBooks],
                    backgroundColor: [
                        'rgba(76, 201, 240, 0.8)',
                        'rgba(255, 158, 0, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 201, 240, 1)',
                        'rgba(255, 158, 0, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 14
                            },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                        }
                    },
                    title: {
                        display: true,
                        text: 'توزيع الكتب',
                        font: {
                            family: 'Cairo',
                            size: 16,
                            weight: 'bold'
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-color')
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// تحميل آخر المعاملات
async function loadRecentTransactions() {
    const transactionsList = document.getElementById('transactionsList');
    
    // هنا يمكنك إضافة كود لجلب المعاملات من الـ API
    // في الوقت الحالي، سنعرض بيانات وهمية للتوضيح
    
    const mockTransactions = [
        { id: 1, type: 'borrow', bookTitle: 'تعلم البرمجة بلغة C++', date: '2024-01-15' },
        { id: 2, type: 'return', bookTitle: 'قواعد البيانات الشامل', date: '2024-01-14' },
        { id: 3, type: 'borrow', bookTitle: 'تعلم الذكاء الاصطناعي', date: '2024-01-13' },
        { id: 4, type: 'borrow', bookTitle: 'أساسيات الشبكات', date: '2024-01-12' },
        { id: 5, type: 'return', bookTitle: 'التصميم الجرافيكي', date: '2024-01-11' }
    ];
    
    transactionsList.innerHTML = '';
    
    mockTransactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = 'transaction-item';
        
        div.innerHTML = `
            <div class="transaction-info">
                <h4>${transaction.bookTitle}</h4>
                <p>${transaction.date}</p>
            </div>
            <span class="transaction-type ${transaction.type}">
                ${transaction.type === 'borrow' ? 'استعارة' : 'إرجاع'}
            </span>
        `;
        
        transactionsList.appendChild(div);
    });
    
    document.getElementById('recentTransactions').textContent = mockTransactions.length;
}

// وظائف مساعدة
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.add('shake');
    
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 5000);
}

// وظائف للأزرار في الجدول
async function editBook(bookId) {
    // تحويل إلى قسم التعديل
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-item[data-section="editBook"]').classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById('editBook').classList.add('active');
    
    // تعبئة البيانات
    document.getElementById('editBookId').value = bookId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/list`);
        const books = await response.json();
        
        const book = books.find(b => b.BookID === bookId);
        
        if (book) {
            document.getElementById('editBookTitle').value = book.Title;
            document.getElementById('editBookAuthor').value = book.Author;
            document.getElementById('bookDetails').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading book details:', error);
    }
}

async function borrowBook(bookId) {
    document.getElementById('borrowBookId').value = bookId;
    
    // تحويل إلى قسم الاستعارة
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-item[data-section="borrowReturn"]').classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById('borrowReturn').classList.add('active');
    
    // تنفيذ الاستعارة
    try {
        const response = await fetch(`${API_BASE_URL}/books/borrow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookID: bookId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('تمت استعارة الكتاب بنجاح!');
            loadBooksList();
            updateDashboardStats();
            loadStatistics();
            loadRecentTransactions();
        } else {
            alert('خطأ: ' + data.message);
        }
    } catch (error) {
        alert('خطأ في الاتصال بالخادم');
    }
}

async function returnBook(bookId) {
    document.getElementById('returnBookId').value = bookId;
    
    // تحويل إلى قسم الإرجاع
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-item[data-section="borrowReturn"]').classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById('borrowReturn').classList.add('active');
    
    // تنفيذ الإرجاع
    try {
        const response = await fetch(`${API_BASE_URL}/books/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookID: bookId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('تم إرجاع الكتاب بنجاح!');
            loadBooksList();
            updateDashboardStats();
            loadStatistics();
            loadRecentTransactions();
        } else {
            alert('خطأ: ' + data.message);
        }
    } catch (error) {
        alert('خطأ في الاتصال بالخادم');
    }
}