# Grade Book Application - UML Architecture Diagram

## System Overview
This UML diagram represents the complete Grade Book Application architecture, including database schema, backend API structure, frontend components, and their relationships.

## Database Schema (Entity Relationship Diagram)

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email
        string password
        string role
        datetime created_at
    }
    
    COURSES {
        int id PK
        string name
        string description
        int teacher_id FK
        datetime created_at
    }
    
    COURSE_ENROLLMENTS {
        int id PK
        int course_id FK
        int student_id FK
        datetime enrolled_at
    }
    
    COURSE_GRADING_RULES {
        int id PK
        int course_id FK
        string evaluation_type
        float weight
    }
    
    EVALUATIONS {
        int id PK
        int student_id FK
        int teacher_id FK
        int course_id FK
        string evaluation_type
        float score
        float max_score
        string notes
        string student_name
        string teacher_name
        string course_name
        datetime created_at
    }
    
    USERS ||--o{ COURSES : "teaches"
    USERS ||--o{ COURSE_ENROLLMENTS : "enrolls_in"
    COURSES ||--o{ COURSE_ENROLLMENTS : "has_students"
    COURSES ||--o{ COURSE_GRADING_RULES : "has_rules"
    COURSES ||--o{ EVALUATIONS : "contains"
    USERS ||--o{ EVALUATIONS : "receives/gives"
```

## Backend Architecture (Class Diagram)

```mermaid
classDiagram
    class App {
        +express: Express
        +port: number
        +cors: CorsMiddleware
        +start(): void
        +setupMiddleware(): void
        +setupRoutes(): void
    }
    
    class AuthMiddleware {
        +JWT_SECRET: string
        +verifyToken(req, res, next): void
        +adminOnly(req, res, next): void
        +teacherOnly(req, res, next): void
        +studentOnly(req, res, next): void
        +teacherOrAdmin(req, res, next): void
    }
    
    class AuthController {
        +login(req, res): Promise
        +register(req, res): Promise
        +verifyToken(req, res): Promise
    }
    
    class UsersController {
        +getAll(req, res): Promise
        +getById(req, res): Promise
        +create(req, res): Promise
        +update(req, res): Promise
        +delete(req, res): Promise
        +getStudents(req, res): Promise
        +getTeachers(req, res): Promise
    }
    
    class CoursesController {
        +getAll(req, res): Promise
        +getById(req, res): Promise
        +create(req, res): Promise
        +update(req, res): Promise
        +delete(req, res): Promise
        +enroll(req, res): Promise
        +unenroll(req, res): Promise
        +getEnrollments(req, res): Promise
        +setGradingRules(req, res): Promise
    }
    
    class EvaluationsController {
        +getAll(req, res): Promise
        +getById(req, res): Promise
        +create(req, res): Promise
        +update(req, res): Promise
        +delete(req, res): Promise
        +exportPDF(req, res): Promise
        +exportCSV(req, res): Promise
        +getStudentReport(req, res): Promise
        +getTeacherReport(req, res): Promise
    }
    
    class DatabaseModels {
        +db: SQLite3
        +initializeDatabase(): void
        +createTables(): void
        +insertSampleData(): void
    }
    
    class UserModel {
        +id: number
        +name: string
        +email: string
        +password: string
        +role: string
        +created_at: Date
    }
    
    class CourseModel {
        +id: number
        +name: string
        +description: string
        +teacher_id: number
        +created_at: Date
    }
    
    class EvaluationModel {
        +id: number
        +student_id: number
        +teacher_id: number
        +course_id: number
        +evaluation_type: string
        +score: number
        +max_score: number
        +notes: string
        +student_name: string
        +teacher_name: string
        +course_name: string
        +created_at: Date
    }
    
    App --> AuthMiddleware
    App --> AuthController
    App --> UsersController
    App --> CoursesController
    App --> EvaluationsController
    
    AuthController --> DatabaseModels
    UsersController --> DatabaseModels
    CoursesController --> DatabaseModels
    EvaluationsController --> DatabaseModels
    
    DatabaseModels --> UserModel
    DatabaseModels --> CourseModel
    DatabaseModels --> EvaluationModel
    
    AuthMiddleware --> AuthController
    AuthMiddleware --> UsersController
    AuthMiddleware --> CoursesController
    AuthMiddleware --> EvaluationsController
```

## Frontend Architecture (Component Diagram)

```mermaid
classDiagram
    class AngularApp {
        +module: gradeBookApp
        +config: routing
        +run(): void
    }
    
    class AuthService {
        +login(credentials): Promise
        +logout(): void
        +getToken(): string
        +isAuthenticated(): boolean
        +getUserRole(): string
        +getCurrentUser(): object
    }
    
    class ApiService {
        +API_BASE: string
        +getApiBase(): string
        +getAuthHeaders(): object
        +handleRequest(promise): Promise
        +users: UserAPI
        +courses: CourseAPI
        +evaluations: EvaluationAPI
    }
    
    class AuthController {
        +login(): void
        +logout(): void
        +checkAuth(): boolean
    }
    
    class NavController {
        +showNavigation(): boolean
        +getUserRole(): string
        +logout(): void
        +isActive(route): boolean
    }
    
    class AdminController {
        +users: Array
        +courses: Array
        +selectedUser: object
        +loadUsers(): void
        +loadCourses(): void
        +createUser(): void
        +updateUser(): void
        +deleteUser(): void
        +manageCourses(): void
        +showReports(): void
    }
    
    class TeacherController {
        +courses: Array
        +evaluations: Array
        +students: Array
        +selectedCourse: object
        +loadCourses(): void
        +loadStudents(): void
        +createEvaluation(): void
        +updateEvaluation(): void
        +exportPDF(): void
        +exportCSV(): void
        +viewReports(): void
    }
    
    class StudentController {
        +evaluations: Array
        +courses: Array
        +grades: object
        +loadEvaluations(): void
        +loadCourses(): void
        +calculateGrades(): void
        +downloadGradesheet(): void
        +viewReports(): void
    }
    
    AngularApp --> AuthService
    AngularApp --> ApiService
    AngularApp --> AuthController
    AngularApp --> NavController
    AngularApp --> AdminController
    AngularApp --> TeacherController
    AngularApp --> StudentController
    
    AuthController --> AuthService
    NavController --> AuthService
    AdminController --> ApiService
    TeacherController --> ApiService
    StudentController --> ApiService
    
    AdminController --> AuthService
    TeacherController --> AuthService
    StudentController --> AuthService
```

## System Flow Diagram (Sequence Diagram)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Middleware
    participant C as Controller
    participant DB as Database
    participant PDF as PDF Generator
    
    U->>F: Login Request
    F->>A: POST /api/auth/login
    A->>DB: Validate Credentials
    DB-->>A: User Data
    A-->>F: JWT Token
    F-->>U: Login Success
    
    U->>F: Create Evaluation
    F->>A: POST /api/evaluations (with JWT)
    A->>A: Verify Token & Role
    A->>C: Forward Request
    C->>DB: Insert Evaluation
    C->>DB: Fetch Names for Preservation
    DB-->>C: Evaluation Created
    C-->>F: Success Response
    F-->>U: Evaluation Created
    
    U->>F: Export PDF
    F->>A: GET /api/evaluations/export-pdf
    A->>A: Verify Token & Role
    A->>C: Forward Request
    C->>DB: Fetch Evaluation Data
    DB-->>C: Evaluation Data
    C->>PDF: Generate PDF
    PDF-->>C: PDF Buffer
    C-->>F: PDF File
    F-->>U: Download PDF
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Render.com Cloud"
        subgraph "Backend Service"
            BE[Node.js Express App]
            DB[(SQLite Database)]
            ENV[Environment Variables<br/>NODE_ENV=production<br/>JWT_SECRET=generated]
        end
        
        subgraph "Frontend Service"
            FE[Static HTML/CSS/JS]
            ANGULAR[AngularJS Application]
        end
        
        subgraph "External Services"
            PDF[PDFKit Library]
            CSV[CSV Writer]
        end
    end
    
    subgraph "Client"
        BROWSER[Web Browser]
        USER[User Interface]
    end
    
    BROWSER --> FE
    FE --> ANGULAR
    ANGULAR --> BE
    BE --> DB
    BE --> PDF
    BE --> CSV
    BE --> ENV
    
    USER --> BROWSER
```

## Role-Based Access Control

```mermaid
graph TD
    subgraph "User Roles"
        ADMIN[Admin]
        TEACHER[Teacher]
        STUDENT[Student]
    end
    
    subgraph "Admin Permissions"
        ADMIN_USERS[Manage Users]
        ADMIN_COURSES[Manage Courses]
        ADMIN_REPORTS[View All Reports]
        ADMIN_EXPORT[Export All Data]
    end
    
    subgraph "Teacher Permissions"
        TEACHER_COURSES[View Assigned Courses]
        TEACHER_EVAL[Create/Edit Evaluations]
        TEACHER_STUDENTS[View Course Students]
        TEACHER_REPORTS[View Course Reports]
        TEACHER_EXPORT[Export Course Data]
    end
    
    subgraph "Student Permissions"
        STUDENT_GRADES[View Own Grades]
        STUDENT_COURSES[View Enrolled Courses]
        STUDENT_REPORTS[View Own Reports]
        STUDENT_PDF[Download Own Gradesheet]
    end
    
    ADMIN --> ADMIN_USERS
    ADMIN --> ADMIN_COURSES
    ADMIN --> ADMIN_REPORTS
    ADMIN --> ADMIN_EXPORT
    ADMIN --> TEACHER_COURSES
    ADMIN --> TEACHER_EVAL
    ADMIN --> TEACHER_STUDENTS
    ADMIN --> TEACHER_REPORTS
    ADMIN --> TEACHER_EXPORT
    
    TEACHER --> TEACHER_COURSES
    TEACHER --> TEACHER_EVAL
    TEACHER --> TEACHER_STUDENTS
    TEACHER --> TEACHER_REPORTS
    TEACHER --> TEACHER_EXPORT
    
    STUDENT --> STUDENT_GRADES
    STUDENT --> STUDENT_COURSES
    STUDENT --> STUDENT_REPORTS
    STUDENT --> STUDENT_PDF
```

## Key Features Architecture

1. **Authentication System**
   - JWT-based authentication
   - Role-based access control
   - Secure password hashing with bcrypt

2. **Course Management**
   - Course creation and enrollment
   - Teacher assignment
   - Grading rules configuration

3. **Evaluation System**
   - Multiple evaluation types
   - Weighted grade calculations
   - Historical name preservation

4. **Export Functionality**
   - PDF generation with PDFKit
   - CSV export capabilities
   - Role-based export permissions

5. **Data Integrity**
   - Foreign key relationships
   - Name preservation for deleted users
   - Comprehensive error handling

This UML diagram provides a complete overview of your Grade Book application's architecture, showing how all components interact to deliver a robust course-based grading system.
