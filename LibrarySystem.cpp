#pragma warning (disable:4996)

#include <iostream>
#include <fstream>
#include <string>
#include <ctime>
#include "httplib.h"
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

struct Node {
    string data;
    Node* next;
    Node(const string& d) : data(d), next(nullptr) {}
};

Node* LoadDataToList(const string& FileName) {
    fstream file(FileName, ios::in);
    Node* head = nullptr;
    Node* tail = nullptr;

    if (file.is_open()) {
        string line;
        while (getline(file, line)) {
            Node* newNode = new Node(line);
            if (!head) head = tail = newNode;
            else { tail->next = newNode; tail = newNode; }
        }
        file.close();
    }
    else {
        fstream f(FileName, ios::out); f.close(); 
    }
    return head;
}

void SaveListToFile(const string& FileName, Node* head) {
    fstream file(FileName, ios::out);
    if (file.is_open()) {
        Node* current = head;
        while (current) {
            if (!current->data.empty())
                file << current->data << endl;
            current = current->next;
        }
        file.close();
    }
}

void MemoryClean(Node* head) {
    while (head) {
        Node* tmp = head;
        head = head->next;
        delete tmp;
    }
}

string GetCurrentDate() {
    time_t now = time(0);
    tm* t = localtime(&now);
    string year = to_string(1900 + t->tm_year);
    string month = to_string(1 + t->tm_mon);
    string day = to_string(t->tm_mday);
    if (month.length() == 1) month = "0" + month;
    if (day.length() == 1) day = "0" + day;
    return year + "-" + month + "-" + day;
}

string AddBook(const string& title, const string& author, int bookID) {
    Node* head = LoadDataToList("Books.txt");
    Node* current = head;

    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);
        try {
            if (stoi(idStr) == bookID) { MemoryClean(head); return "ERROR: Book ID exists!"; }
        }
        catch (...) {}
        current = current->next;
    }

    fstream file("Books.txt", ios::out | ios::app);
    if (file.is_open()) {
        file << title << "|" << author << "|" << bookID << "|Available\n";
        file.close();
        MemoryClean(head);
        return "SUCCESS: Book added!";
    }

    MemoryClean(head);
    return "ERROR: Could not add book!";
}

string DeleteBook(int bookID) {
    Node* head = LoadDataToList("Books.txt");
    Node* dummy = new Node("");
    dummy->next = head;
    Node* prev = dummy;
    Node* current = head;
    bool found = false;

    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);
        try {
            if (stoi(idStr) == bookID) {
                found = true;
                prev->next = current->next;
                delete current;
                current = prev->next;
                continue;
            }
        }
        catch (...) {}
        prev = current;
        current = current->next;
    }

    SaveListToFile("Books.txt", dummy->next);
    MemoryClean(dummy);
    return found ? "SUCCESS: Book deleted!" : "ERROR: Book not found!";
}

void WriteTransaction(int bookID, const string& title, const string& status) {
    fstream file("Transactions.txt", ios::out | ios::app);
    if (file.is_open()) {
        string date = GetCurrentDate();
        if (status == "Borrowed")
            file << bookID << "|" << title << "|" << date << "|-\n";
        else
            file << bookID << "|" << title << "|-|" << date << "\n";
        file.close();
    }
}

bool IsBookBorrowed(int bookID) {
    Node* head = LoadDataToList("Transactions.txt");
    Node* current = head;
    while (current) {
        size_t pos1 = current->data.find('|');
        string idStr = current->data.substr(0, pos1);
        string status = current->data.substr(current->data.rfind('|') + 1);
        try {
            if (stoi(idStr) == bookID && status == "Borrowed") { MemoryClean(head); return true; }
        }
        catch (...) {}
        current = current->next;
    }
    MemoryClean(head);
    return false;
}

string BorrowBook(int bookID) {
    if (IsBookBorrowed(bookID)) return "ERROR: Book already borrowed!";

    Node* head = LoadDataToList("Books.txt");
    Node* current = head;
    string title = "";
    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);
        try {
            if (stoi(idStr) == bookID) {
                title = current->data.substr(0, pos1);
                current->data = title + "|" + current->data.substr(pos1 + 1, pos2 - pos1 - 1) + "|" + idStr + "|Borrowed";
                break;
            }
        }
        catch (...) {}
        current = current->next;
    }

    SaveListToFile("Books.txt", head);
    MemoryClean(head);

    WriteTransaction(bookID, title, "Borrowed");

    return "SUCCESS: Book borrowed!";
}

string ReturnBook(int bookID) {
    Node* head = LoadDataToList("Books.txt");
    Node* current = head;
    string title = "";
    bool found = false;
    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);
        string status = current->data.substr(pos3 + 1);
        try {
            if (stoi(idStr) == bookID && status == "Borrowed") {
                title = current->data.substr(0, pos1);
                current->data = title + "|" + current->data.substr(pos1 + 1, pos2 - pos1 - 1) + "|" + idStr + "|Available";
                found = true;
                break;
            }
        }
        catch (...) {}
        current = current->next;
    }
    SaveListToFile("Books.txt", head);
    MemoryClean(head);

    if (!found) return "ERROR: Book is not borrowed!";

    WriteTransaction(bookID, title, "Returned");

    return "SUCCESS: Book returned!";
}

string UpdateBook(int bookID, const string& newTitle, const string& newAuthor) {
    Node* head = LoadDataToList("Books.txt");
    Node* current = head;
    bool found = false;

    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);

        try {
            if (stoi(idStr) == bookID) {
                string status = current->data.substr(pos3 + 1);
                current->data = newTitle + "|" + newAuthor + "|" + idStr + "|" + status;
                found = true;
                break;
            }
        }
        catch (...) {}
        current = current->next;
    }

    SaveListToFile("Books.txt", head);
    MemoryClean(head);

    if (found) {
        Node* transHead = LoadDataToList("Transactions.txt");
        Node* transCurrent = transHead;

        while (transCurrent) {
            size_t pos1 = transCurrent->data.find('|');
            size_t pos2 = transCurrent->data.find('|', pos1 + 1);
            string transIDStr = transCurrent->data.substr(0, pos1);

            try {
                if (stoi(transIDStr) == bookID) {
                    size_t pos3 = transCurrent->data.find('|', pos2 + 1);
                    size_t pos4 = transCurrent->data.find('|', pos3 + 1);
                    string borrowDate = transCurrent->data.substr(pos3 + 1, (pos4 != string::npos ? pos4 - pos3 - 1 : string::npos));
                    string returnDate = "";

                    if (pos4 != string::npos) {
                        returnDate = transCurrent->data.substr(pos4 + 1);
                    }

                    transCurrent->data = to_string(bookID) + "|" + newTitle + "|" +
                        borrowDate + "|" + returnDate;
                }
            }
            catch (...) {}
            transCurrent = transCurrent->next;
        }

        SaveListToFile("Transactions.txt", transHead);
        MemoryClean(transHead);

        return "SUCCESS: Book updated!";
    }

    return "ERROR: Book not found!";
}

json ListBooks() {
    Node* head = LoadDataToList("Books.txt");
    Node* current = head;
    json jArr = json::array();

    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string title = current->data.substr(0, pos1);
        string author = current->data.substr(pos1 + 1, pos2 - pos1 - 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);
        string status = current->data.substr(pos3 + 1);
        try {
            json j;
            j["BookID"] = stoi(idStr);
            j["Title"] = title;
            j["Author"] = author;
            j["Status"] = status;
            jArr.push_back(j);
        }
        catch (...) {}
        current = current->next;
    }
    MemoryClean(head);
    return jArr;
}

json SearchBooks(const string& query) {
    Node* head = LoadDataToList("Books.txt");
    Node* current = head;
    json jArr = json::array();

    while (current) {
        size_t pos1 = current->data.find('|');
        size_t pos2 = current->data.find('|', pos1 + 1);
        size_t pos3 = current->data.find('|', pos2 + 1);
        string title = current->data.substr(0, pos1);
        string author = current->data.substr(pos1 + 1, pos2 - pos1 - 1);
        string idStr = current->data.substr(pos2 + 1, pos3 - pos2 - 1);
        string status = current->data.substr(pos3 + 1);

        if (title.find(query) != string::npos || author.find(query) != string::npos || idStr == query) {
            try {
                json j;
                j["BookID"] = stoi(idStr);
                j["Title"] = title;
                j["Author"] = author;
                j["Status"] = status;
                jArr.push_back(j);
            }
            catch (...) {}
        }
        current = current->next;
    }

    MemoryClean(head);
    return jArr;
}

int main() {
    // Ensure files exist
    fstream f1("Books.txt", ios::app); f1.close();
    fstream f2("Transactions.txt", ios::app); f2.close();

    httplib::Server svr;

    // CORS headers
    svr.set_pre_routing_handler([](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        if (req.method == "OPTIONS") { res.status = 200; return httplib::Server::HandlerResponse::Handled; }
        return httplib::Server::HandlerResponse::Unhandled;
        });

    // ===== API Endpoints =====
    svr.Post("/api/books/add", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto j = json::parse(req.body);
            string title = j["title"];
            string author = j["author"];
            int bookID = j["bookID"];
            string result = AddBook(title, author, bookID);
            json response;
            response["success"] = (result.find("SUCCESS") != string::npos);
            response["message"] = result;
            res.set_content(response.dump(), "application/json");
        }
        catch (...) { json r; r["success"] = false; r["message"] = "Invalid request"; res.set_content(r.dump(), "application/json"); }
        });

    svr.Post("/api/books/delete", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto j = json::parse(req.body);
            int bookID = j["bookID"];
            string result = DeleteBook(bookID);
            json response;
            response["success"] = (result.find("SUCCESS") != string::npos);
            response["message"] = result;
            res.set_content(response.dump(), "application/json");
        }
        catch (...) { json r; r["success"] = false; r["message"] = "Invalid request"; res.set_content(r.dump(), "application/json"); }
        });

    svr.Post("/api/books/borrow", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto j = json::parse(req.body);
            int bookID = j["bookID"];
            string result = BorrowBook(bookID);
            json response;
            response["success"] = (result.find("SUCCESS") != string::npos);
            response["message"] = result;
            res.set_content(response.dump(), "application/json");
        }
        catch (...) { json r; r["success"] = false; r["message"] = "Invalid request"; res.set_content(r.dump(), "application/json"); }
        });

    svr.Post("/api/books/return", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto j = json::parse(req.body);
            int bookID = j["bookID"];
            string result = ReturnBook(bookID);
            json response;
            response["success"] = (result.find("SUCCESS") != string::npos);
            response["message"] = result;
            res.set_content(response.dump(), "application/json");
        }
        catch (...) { json r; r["success"] = false; r["message"] = "Invalid request"; res.set_content(r.dump(), "application/json"); }
        });

    // =========== NEW ENDPOINT: Update Book ===========
    svr.Post("/api/books/update", [](const httplib::Request& req, httplib::Response& res) {
        try {
            auto j = json::parse(req.body);
            int bookID = j["bookID"];
            string newTitle = j["newTitle"];
            string newAuthor = j["newAuthor"];
            string result = UpdateBook(bookID, newTitle, newAuthor);
            json response;
            response["success"] = (result.find("SUCCESS") != string::npos);
            response["message"] = result;
            res.set_content(response.dump(), "application/json");
        }
        catch (...) {
            json r;
            r["success"] = false;
            r["message"] = "Invalid request";
            res.set_content(r.dump(), "application/json");
        }
        });

    svr.Get("/api/books/list", [](const httplib::Request&, httplib::Response& res) {
        json response = ListBooks();
        res.set_content(response.dump(), "application/json");
        });

    svr.Get("/api/books/search", [](const httplib::Request& req, httplib::Response& res) {
        string query = req.get_param_value("q");
        json response = SearchBooks(query);
        res.set_content(response.dump(), "application/json");
        });

    cout << "Library Server running on http://localhost:8080\n";
    svr.listen("localhost", 8080);

    return 0;
}