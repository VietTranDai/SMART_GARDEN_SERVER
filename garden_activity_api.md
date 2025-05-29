# API Endpoints cho Quản lý Hoạt động Vườn

Đây là tài liệu mô tả các API endpoint có trong `garden-activity.controller.ts`.

## Tổng quan

Controller này quản lý các hoạt động liên quan đến vườn cây, bao gồm việc tạo mới, lấy danh sách, xem chi tiết, phân tích và thống kê hoạt động.

## Endpoints

### 1. Lấy danh sách hoạt động vườn (có phân trang và bộ lọc)

- **HTTP Method:** `GET`
- **Path:** `/activities`
- **Mô tả:** Trả về danh sách các hoạt động của người dùng đã được xác thực. Hỗ trợ phân trang và lọc theo nhiều tiêu chí.
- **Query Parameters:**
    - `gardenId` (Number, Optional): Lọc theo ID khu vườn.
    - `type` (Enum<ActivityType>, Optional): Lọc theo loại hoạt động (ví dụ: `WATERING`, `PLANTING`).
    - `startDate` (String, Optional): Lọc từ ngày (ISO 8601).
    - `endDate` (String, Optional): Lọc đến ngày (ISO 8601).
    - `page` (Number, Optional, Default: 1): Số trang.
    - `limit` (Number, Optional, Default: 10): Số mục trên mỗi trang.
- **Dữ liệu trả về:** `PaginatedGardenActivitiesResultDto`
    - `items`: Mảng các đối tượng `GardenActivityDto`. Mỗi `GardenActivityDto` chứa thông tin chi tiết của một hoạt động, bao gồm:
        - `id`: ID hoạt động.
        - `gardenId`: ID vườn.
        - `gardenerId`: ID người làm vườn.
        - `name`: Tên hoạt động.
        - `activityType`: Loại hoạt động (enum `ActivityType`).
        - `timestamp`: Thời gian thực hiện.
        - `plantName` (Optional): Tên cây.
        - `plantGrowStage` (Optional): Giai đoạn phát triển của cây.
        - `humidity`, `temperature`, `lightIntensity`, `waterLevel`, `rainfall`, `soilMoisture`, `soilPH` (Optional): Các thông số môi trường đo được.
        - `details`, `reason`, `notes` (Optional): Mô tả, lý do, ghi chú thêm.
        - `createdAt`, `updatedAt`: Thời gian tạo và cập nhật.
    - `meta`: Đối tượng `PaginationMetaDto` chứa thông tin phân trang:
        - `totalItems`: Tổng số hoạt động.
        - `itemsPerPage`: Số hoạt động trên trang hiện tại.
        - `currentPage`: Trang hiện tại.
        - `totalPages`: Tổng số trang.

### 2. Tạo hoạt động vườn mới

- **HTTP Method:** `POST`
- **Path:** `/activities`
- **Mô tả:** Tạo một hoạt động vườn mới cho người dùng hiện tại.
- **Request Body:** `CreateActivityDto` (chi tiết các trường cần xem trong file DTO tương ứng)
- **Dữ liệu trả về:** `GardenActivityDto`
    - Đối tượng chứa thông tin chi tiết của hoạt động vừa được tạo, cấu trúc tương tự như `GardenActivityDto` ở mục 1.

### 3. Lấy chi tiết một hoạt động vườn theo ID

- **HTTP Method:** `GET`
- **Path:** `/activities/:activityId`
- **Mô tả:** Trả về thông tin chi tiết của một hoạt động vườn cụ thể.
- **Path Parameters:**
    - `activityId` (Number, Required): ID của hoạt động vườn.
- **Dữ liệu trả về:** `GardenActivityDto`
    - Đối tượng chứa thông tin chi tiết của hoạt động, cấu trúc tương tự như `GardenActivityDto` ở mục 1.

### 4. Lấy phân tích chi tiết cho một hoạt động vườn

- **HTTP Method:** `GET`
- **Path:** `/activities/:activityId/analysis`
- **Mô tả:** Trả về kết quả phân tích chi tiết cho một hoạt động vườn cụ thể.
- **Path Parameters:**
    - `activityId` (Number, Required): ID của hoạt động cần phân tích.
- **Dữ liệu trả về:** `GardenActivityAnalyticsDto` (Đây là một DTO phức tạp, chứa nhiều khía cạnh phân tích. Cần tham khảo file `garden-activity.dto.ts` để biết chi tiết. Các trường chính có thể bao gồm):
    - Thông tin cơ bản của hoạt động (tương tự `GardenActivityDto`).
    - `executionDetails`: Chi tiết thực hiện (thời gian, phương pháp, công cụ, khối lượng công việc, kết quả tức thì, điều kiện thực hiện).
    - `userPerformance`: Phân tích hiệu suất người dùng (kỹ năng, hiệu quả làm việc, thói quen, động lực).
    - `activityPatterns`: Phân tích tần suất và mẫu hoạt động (tần suất, mẫu thời gian, mẫu tuần tự).
    - `effectivenessAnalysis`: Phân tích hiệu quả và kết quả (hiệu quả tức thì, dài hạn, đánh giá, kết quả đạt được).
    - `learningAnalysis`: Phân tích học hỏi và cải thiện (kinh nghiệm, kỹ năng, lỗi và bài học, khuyến nghị cải thiện).
    - `comparisonAnalysis`: So sánh và benchmarking (với bản thân, cộng đồng, tiêu chuẩn ngành).
    - `predictionsAndRecommendations`: Dự đoán và khuyến nghị (hoạt động tiếp theo, cải thiện, cảnh báo, mục tiêu).
    - Thông tin `gardener`, `garden`, `weatherObservation`, `evaluations`, `photoEvaluations`, `wateringSchedules`.

### 5. Lấy thống kê hoạt động vườn

- **HTTP Method:** `GET`
- **Path:** `/activities/stats`
- **Mô tả:** Trả về các thống kê về hoạt động vườn của người dùng.
- **Query Parameters:**
    - `gardenId` (Number, Optional): Lọc theo ID khu vườn.
    - `activityType` (Enum<ActivityType>, Optional): Lọc theo loại hoạt động.
    - `startDate` (String, Required): Ngày bắt đầu thống kê (ISO 8601).
    - `endDate` (String, Required): Ngày kết thúc thống kê (ISO 8601).
- **Dữ liệu trả về:** `ActivityStatsResponseDto`
    - `overview`: Đối tượng `ActivityOverviewStatsDto` chứa thống kê tổng quan:
        - `totalActivities`: Tổng số hoạt động.
        - `averagePerDay`: Trung bình hoạt động mỗi ngày.
        - `activeDays`: Số ngày có hoạt động.
        - `totalDays`: Tổng số ngày trong khoảng thời gian.
        - `activityRate`: Tỷ lệ ngày có hoạt động.
        - `mostCommonActivity`: Loại hoạt động phổ biến nhất.
        - `mostCommonActivityName`: Tên hiển thị của loại hoạt động phổ biến nhất.
        - `mostActiveGarden` (Optional): Khu vườn có nhiều hoạt động nhất.
    - `byActivityType`: Mảng các đối tượng `ActivityTypeStatsDto`, mỗi đối tượng chứa:
        - `type`: Loại hoạt động.
        - `displayName`: Tên hiển thị.
        - `count`: Số lượng.
        - `percentage`: Phần trăm.
    - `dailyStats`: Mảng các đối tượng `DailyActivityStatsDto`, mỗi đối tượng chứa:
        - `date`: Ngày.
        - `activityCount`: Số lượng hoạt động trong ngày.
        - `activityBreakdown`: Chi tiết theo từng loại hoạt động trong ngày (`ActivityTypeStatsDto[]`).
    - `monthlyStats`: Mảng các đối tượng `MonthlyActivityStatsDto`, mỗi đối tượng chứa:
        - `month`: Tháng.
        - `activityCount`: Số lượng hoạt động trong tháng.
        - `activeDays`: Số ngày có hoạt động trong tháng.
        - `averagePerDay`: Trung bình hoạt động mỗi ngày trong tháng.
    - `byGarden` (Optional): Mảng các đối tượng `GardenActivityStatsDto` (nếu không lọc theo `gardenId`), mỗi đối tượng chứa:
        - `gardenId`, `gardenName`, `gardenType`: Thông tin khu vườn.
        - `totalActivities`: Tổng hoạt động trong vườn.
        - `lastActivity`: Thời gian hoạt động cuối cùng.
        - `activityBreakdown`: Chi tiết theo từng loại hoạt động trong vườn (`ActivityTypeStatsDto[]`).
    - `trends`: Mảng các đối tượng `ActivityTrendDto` thể hiện xu hướng hoạt động:
        - `period`: Khoảng thời gian (ngày, tuần, tháng).
        - `label`: Nhãn thời gian.
        - `count`: Số lượng hoạt động.
        - `changePercent`: Thay đổi so với kỳ trước (%).
    - `generatedAt`: Thời gian tạo báo cáo.
    - `period`: Khoảng thời gian được thống kê (`startDate`, `endDate`). 