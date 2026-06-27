# 🎮 Hệ Thống Pick-Em MLBB Tournament

Hệ thống pick-em hoàn chỉnh cho MLBB Tournament với 2 phase độc lập: **Wildcard** 🎯 và **Main Stage** 🏆

## 📁 Cấu Trúc File

```
├── pick-em.html                 # 👥 Trang cho người dùng
├── pick-em.js                   # Script cho người dùng
├── pick-em-admin.html           # ⚙️ Trang quản lý cho admin
├── pick-em-admin.js             # Script cho admin
├── firebase.js                  # Cấu hình Firebase
├── PICK-EM-GUIDE.md            # Hướng dẫn chi tiết
└── README.md                   # File này
```

## 🚀 Bắt Đầu Nhanh

### 1. Cài Đặt Firebase

Chỉnh sửa `firebase.js` và thay thế `firebaseConfig` bằng cấu hình của Firebase project của bạn:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  databaseURL: "https://your-project.firebaseio.com"
};
```

### 2. Tạo Database Rules (Firebase)

Truy cập Firebase Console → Realtime Database → Rules, đặt:

```json
{
  "rules": {
    "pickEm": {
      ".read": true,
      ".write": true
    }
  }
}
```

**⚠️ Lưu ý**: Để bảo mật, nên thêm authentication sau này.

### 3. Sử Dụng

- **Người dùng**: Mở `pick-em.html`
- **Admin**: Mở `pick-em-admin.html`

## 🎯 Tính Năng Chính

### Phía Người Dùng
- ✅ Đăng ký với: Tên, ID Ingame, ID Server
- ✅ Đăng nhập với: ID Ingame, ID Server
- ✅ Chọn đáp án cho Wildcard Phase
- ✅ Chọn đáp án cho Main Stage
- ✅ Xem bảng xếp hạng Top 3
- ✅ Theo dõi điểm số trong thời gian thực

### Phía Admin
- ✅ Tạo câu hỏi cho 2 phase
- ✅ Đặt điểm cho mỗi câu
- ✅ Nhập đáp án chính xác
- ✅ **Tự động tính lại điểm** cho tất cả người chơi
- ✅ Khóa/mở khóa từng phase độc lập
- ✅ Quản lý câu hỏi (sửa/xóa)

## 💾 Cấu Trúc Database

```
pickEm/
├── users/
│   └── {gameId}_{serverId}/
│       ├── name, gameId, serverId
│       ├── wildcardPicks, mainStagePicks
│       ├── wildcardScore, mainStageScore
│       └── totalScore
├── questions/
│   ├── wildcard/{questionId}
│   └── mainStage/{questionId}
├── correctAnswers/
│   ├── wildcard/{questionId}
│   └── mainStage/{questionId}
└── status/
    ├── wildcard/locked
    └── mainStage/locked
```

## 📖 Hướng Dẫn Chi Tiết

Xem file `PICK-EM-GUIDE.md` để có hướng dẫn chi tiết từng bước.

## 🔄 Quy Trình Hoạt Động

```
1. Admin tạo câu hỏi cho Wildcard
   ↓
2. Admin mở khóa Wildcard Phase
   ↓
3. Người chơi chọn đáp án Wildcard
   ↓
4. Admin nhập đáp án Wildcard
   ↓
5. → Hệ thống tính lại điểm tự động
   ↓
6. Admin khóa Wildcard Phase
   ↓
7. Lặp lại 1-6 cho Main Stage
   ↓
8. Xem kết quả cuối cùng và bảng xếp hạng
```

## 🔐 Tính Năng Bảo Mật

### Khóa Phase
- Khi phase được khóa, người chơi **không thể** chỉnh sửa lựa chọn
- Nhưng admin **VẪN CÓ THỂ** nhập đáp án
- Mở khóa lại → người chơi có thể chỉnh sửa

### Độc Lập Phase
- Wildcard và Main Stage hoàn toàn độc lập
- Khóa Wildcard không ảnh hưởng Main Stage

## 🎮 Ví Dụ Thực Tế

### Wildcard Phase
- **Câu 1**: "Team nào sẽ thắng trận 1?" → 5 điểm
- **Câu 2**: "MVP trận đó là ai?" → 10 điểm
- **Câu 3**: "Team nào sẽ vào Main Stage?" → 15 điểm

### Main Stage
- **Câu 1**: "Ai sẽ là Champion?" → 20 điểm
- **Câu 2**: "Team nào runner-up?" → 15 điểm

**Kết quả**: Tính tổng từ cả 2 phase, người chơi có tối đa 65 điểm

## ⚠️ Lưu Ý Quan Trọng

1. **Cài đặt Firebase** trước khi sử dụng
2. **Không có xác thực** trên trang admin (bảo mật trang này)
3. **Dữ liệu lưu trên Firebase** nên luôn an toàn
4. **Refresh trang** khi có thay đổi từ admin
5. **Clear cache** nếu gặp lỗi

## 🐛 Troubleshooting

| Vấn Đề | Giải Pháp |
|-------|----------|
| Câu hỏi không xuất hiện | Kiểm tra Firebase connection, refresh trang |
| Điểm không cập nhật | Kiểm tra đáp án đã được nhập chưa |
| Không thể chọn khi khóa | Đây là bình thường, mở khóa phase |
| Lỗi Firebase connection | Kiểm tra config trong firebase.js |

## 📧 Firebase Setup Hướng Dẫn

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới
3. Thêm Realtime Database
4. Copy credentials vào `firebase.js`
5. Thiết lập Database Rules như trên

## 🎨 Tùy Chỉnh

### Màu Sắc
- **Người dùng**: Màu tím 💜 (pick-em.html - class `.btn`)
- **Admin**: Màu đỏ ❤️ (pick-em-admin.html - class `.btn`)

### Điểm Số
- Admin đặt từng câu hỏi, không có giới hạn

### Câu Hỏi
- Không giới hạn số lượng
- Có thể có 2+ đáp án

## 📱 Responsive Design

Hệ thống tương thích với:
- 💻 Desktop
- 📱 Mobile
- 📱 Tablet

## 🚀 Tối Ưu Hóa Tương Lai

- [ ] Thêm xác thực cho Admin
- [ ] Nội dung đa ngôn ngữ
- [ ] Export dữ liệu
- [ ] Analytics dashboard
- [ ] Email notification
- [ ] Upload hình ảnh câu hỏi

## 📜 License

Miễn phí sử dụng và chỉnh sửa

## 💬 Hỗ Trợ

Xem chi tiết trong `PICK-EM-GUIDE.md`

---

**Phiên bản**: 1.0  
**Cập nhật lần cuối**: 2024  
**Tương thích**: Tất cả trình duyệt hiện đại
