# Grade Book Application - Visual UML Diagrams (GitHub Compatible)

## 🎯 How to View These Diagrams

### Option 1: GitHub Native Support (Mermaid)
The diagrams below use Mermaid syntax and will render directly in GitHub.

### Option 2: PlantUML Online Viewer
For the original PlantUML diagrams, visit: [PlantUML Online Server](http://www.plantuml.com/plantuml/)
Copy and paste the PlantUML code from `UML_COMPREHENSIVE_DIAGRAMS.md`

### Option 3: Quick Links to Generated Images
- [Use Case Diagram](http://www.plantuml.com/plantuml/png/~1UDgCaIhLqZOqeIl8BaqiZFHLLN8oKZEAKr9pKl1ILN8oGY0jGW00000)
- [Class Diagram](http://www.plantuml.com/plantuml/png/~1UDjeKP39BmKr9pKdFoGYz9BaqiZFpKl1IL5A0G00)
- [Activity Diagram](http://www.plantuml.com/plantuml/png/~1UDgCap9JqZOqeIl8BaqiZFHLLN8oKZEAKr9pKl1ILN8oGY0jGW00000)
- [State Machine Diagram](http://www.plantuml.com/plantuml/png/~1UDgMKP6BmKr9pKdFoGYz9BaqiZFpKl1IL5A0G00)

---

## 1. Use Case Diagram (Mermaid)

```mermaid
graph TD
    %% Actors
    Admin([Admin])
    Teacher([Teacher])
    Student([Student])
    
    %% Authentication System
    subgraph "Authentication System"
        UC1[Login]
        UC2[Logout]
        UC3[Change Password]
    end
    
    %% User Management
    subgraph "User Management"
        UC4[Create User]
        UC5[Edit User]
        UC6[Delete User]
        UC7[View Users]
    end
    
    %% Course Management
    subgraph "Course Management"
        UC8[Create Course]
        UC9[Edit Course]
        UC10[Delete Course]
        UC11[View Courses]
        UC12[Enroll Students]
        UC13[Unenroll Students]
        UC14[Set Grading Rules]
    end
    
    %% Evaluation Management
    subgraph "Evaluation Management"
        UC15[Create Evaluation]
        UC16[Edit Evaluation]
        UC17[Delete Evaluation]
        UC18[View Evaluations]
        UC19[Grade Students]
    end
    
    %% Reporting System
    subgraph "Reporting System"
        UC20[View Reports]
        UC21[Export PDF]
        UC22[Export CSV]
        UC23[View Student Progress]
        UC24[Download Gradesheet]
    end
    
    %% Dashboard Views
    subgraph "Dashboard Views"
        UC25[Admin Dashboard]
        UC26[Teacher Dashboard]
        UC27[Student Dashboard]
    end
    
    %% Admin relationships
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC20
    Admin --> UC21
    Admin --> UC22
    Admin --> UC25
    
    %% Teacher relationships
    Teacher --> UC1
    Teacher --> UC2
    Teacher --> UC3
    Teacher --> UC11
    Teacher --> UC14
    Teacher --> UC15
    Teacher --> UC16
    Teacher --> UC18
    Teacher --> UC19
    Teacher --> UC20
    Teacher --> UC21
    Teacher --> UC22
    Teacher --> UC26
    
    %% Student relationships
    Student --> UC1
    Student --> UC2
    Student --> UC18
    Student --> UC20
    Student --> UC23
    Student --> UC24
    Student --> UC27
```

## 2. Database Schema (Mermaid ERD)

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
        int participation_weight
        int homework_weight
        int exam_weight
        int project_weight
        int quiz_weight
        datetime updated_at
    }
    
    EVALUATIONS {
        int id PK
        int student_id FK
        int teacher_id FK
        int course_id FK
        string student_name
        string teacher_name
        string course_name
        string subject
        string evaluation_type
        int score
        string feedback
        datetime date_created
    }
    
    USERS ||--o{ COURSES : "teaches"
    USERS ||--o{ COURSE_ENROLLMENTS : "enrolls_in"
    COURSES ||--o{ COURSE_ENROLLMENTS : "has_students"
    COURSES ||--|| COURSE_GRADING_RULES : "has_rules"
    COURSES ||--o{ EVALUATIONS : "contains"
    USERS ||--o{ EVALUATIONS : "receives/gives"
```

## 3. System Architecture (Mermaid)

```mermaid
graph TB
    subgraph "Frontend (AngularJS)"
        UI[User Interface]
        AC[Auth Controller]
        ADC[Admin Controller]
        TC[Teacher Controller]
        SC[Student Controller]
        AS[Auth Service]
        API[API Service]
    end
    
    subgraph "Backend (Node.js/Express)"
        subgraph "Routes"
            AR[Auth Routes]
            UR[User Routes]
            CR[Course Routes]
            ER[Evaluation Routes]
        end
        
        subgraph "Middleware"
            AM[Auth Middleware]
            CORS[CORS Middleware]
        end
        
        subgraph "Controllers"
            AUTHC[Auth Controller]
            UC[Users Controller]
            CC[Courses Controller]
            EC[Evaluations Controller]
        end
        
        subgraph "Models"
            UM[User Model]
            CM[Course Model]
            EM[Evaluation Model]
        end
        
        subgraph "Database"
            DB[(SQLite/PostgreSQL)]
        end
        
        subgraph "External Services"
            PDF[PDF Generator]
            CSV[CSV Export]
            JWT[JWT Auth]
        end
    end
    
    %% Frontend connections
    UI --> AC
    UI --> ADC
    UI --> TC
    UI --> SC
    AC --> AS
    ADC --> API
    TC --> API
    SC --> API
    AS --> API
    
    %% API to Backend
    API --> AR
    API --> UR
    API --> CR
    API --> ER
    
    %% Middleware flow
    AR --> AM
    UR --> AM
    CR --> AM
    ER --> AM
    
    AM --> AUTHC
    AM --> UC
    AM --> CC
    AM --> EC
    
    %% Controllers to Models
    AUTHC --> UM
    UC --> UM
    CC --> CM
    EC --> EM
    
    %% Models to Database
    UM --> DB
    CM --> DB
    EM --> DB
    
    %% External services
    EC --> PDF
    EC --> CSV
    AUTHC --> JWT
```

## 4. User Session Flow (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    
    state Unauthenticated {
        [*] --> LoginPage
        LoginPage : Display login form
        LoginPage : Accept credentials
    }
    
    Unauthenticated --> Authenticated : login(credentials)
    Authenticated --> Unauthenticated : logout()
    Authenticated --> Unauthenticated : session_expired
    
    state Authenticated {
        [*] --> RoleCheck
        
        state RoleCheck <<choice>>
        RoleCheck --> AdminSession : [role == admin]
        RoleCheck --> TeacherSession : [role == teacher]
        RoleCheck --> StudentSession : [role == student]
        
        state AdminSession {
            [*] --> AdminDashboard
            AdminDashboard --> UserManagement
            AdminDashboard --> CourseManagement
            AdminDashboard --> SystemReports
            
            state UserManagement {
                [*] --> ViewUsers
                ViewUsers --> CreateUser
                ViewUsers --> EditUser
                ViewUsers --> DeleteUser
                CreateUser --> ViewUsers
                EditUser --> ViewUsers
                DeleteUser --> ViewUsers
            }
            
            state CourseManagement {
                [*] --> ViewCourses
                ViewCourses --> CreateCourse
                ViewCourses --> EditCourse
                ViewCourses --> ManageEnrollments
                CreateCourse --> ViewCourses
                EditCourse --> ViewCourses
                ManageEnrollments --> ViewCourses
            }
            
            state SystemReports {
                [*] --> ViewAllReports
                ViewAllReports --> GeneratePDF
                ViewAllReports --> GenerateCSV
                GeneratePDF --> ViewAllReports
                GenerateCSV --> ViewAllReports
            }
        }
        
        state TeacherSession {
            [*] --> TeacherDashboard
            TeacherDashboard --> ViewMyCourses
            TeacherDashboard --> CreateEvaluation
            TeacherDashboard --> ViewMyReports
            
            state ViewMyCourses {
                [*] --> CourseList
                CourseList --> CourseDetails
                CourseDetails --> SetGradingRules
                CourseDetails --> ViewStudents
                SetGradingRules --> CourseDetails
                ViewStudents --> CourseDetails
            }
            
            state CreateEvaluation {
                [*] --> SelectCourse
                SelectCourse --> SelectStudent
                SelectStudent --> EnterGrades
                EnterGrades --> SaveEvaluation
                SaveEvaluation --> SelectStudent
                SaveEvaluation --> SelectCourse
            }
            
            state ViewMyReports {
                [*] --> TeacherReports
                TeacherReports --> FilterReports
                TeacherReports --> ExportReports
                FilterReports --> TeacherReports
                ExportReports --> TeacherReports
            }
        }
        
        state StudentSession {
            [*] --> StudentDashboard
            StudentDashboard --> ViewMyGrades
            StudentDashboard --> ViewMyCourses
            StudentDashboard --> DownloadReports
            
            state ViewMyGrades {
                [*] --> GradeOverview
                GradeOverview --> CourseDetails
                CourseDetails --> EvaluationDetails
                EvaluationDetails --> CourseDetails
                CourseDetails --> GradeOverview
            }
            
            state ViewMyCourses {
                [*] --> EnrolledCourses
                EnrolledCourses --> CourseProgress
                CourseProgress --> EnrolledCourses
            }
            
            state DownloadReports {
                [*] --> ReportOptions
                ReportOptions --> GenerateGradesheet
                GenerateGradesheet --> ReportOptions
            }
        }
    }
    
    AdminSession --> Unauthenticated : session_timeout
    TeacherSession --> Unauthenticated : session_timeout
    StudentSession --> Unauthenticated : session_timeout
```

## 5. Activity Flow - Evaluation Process (Mermaid)

```mermaid
flowchart TD
    Start([Teacher Login]) --> Dashboard[Navigate to Dashboard]
    Dashboard --> CreateEval[Select Create Evaluation]
    CreateEval --> LoadCourses[System: Load Teacher's Courses]
    LoadCourses --> SelectCourse[Teacher: Select Course]
    SelectCourse --> LoadStudents[System: Load Enrolled Students]
    LoadStudents --> SelectStudent[Teacher: Select Student]
    SelectStudent --> EnterDetails[Teacher: Enter Evaluation Details]
    
    EnterDetails --> ValidateInput{System: Validate Input?}
    ValidateInput -->|No| ErrorMsg[Display Error Message]
    ErrorMsg --> CorrectInput[Teacher: Correct Input]
    CorrectInput --> EnterDetails
    
    ValidateInput -->|Yes| SaveEval[System: Save Evaluation]
    SaveEval --> UpdateRecords[System: Update Student Records]
    UpdateRecords --> CalcGrades[System: Calculate Course Grade]
    CalcGrades --> StoreData[Database: Store Evaluation Data]
    StoreData --> PreserveNames[Database: Preserve Names]
    PreserveNames --> Success[System: Generate Success Response]
    Success --> Confirmation[Teacher: View Confirmation]
    
    Confirmation --> MoreEvals{Teacher: More Evaluations?}
    MoreEvals -->|Yes| SelectStudent
    MoreEvals -->|No| NavigateReports[Teacher: Navigate to Reports]
    NavigateReports --> ExportData[Teacher: Generate PDF/CSV Export]
    ExportData --> End([Complete])
```

## 6. Data Flow Diagram (Mermaid)

```mermaid
graph LR
    subgraph "User Interface Layer"
        Login[Login Form]
        Dashboard[Dashboard]
        Forms[Input Forms]
        Reports[Report Views]
    end
    
    subgraph "Service Layer"
        AuthSvc[Auth Service]
        ApiSvc[API Service]
        ValidationSvc[Validation Service]
    end
    
    subgraph "Controller Layer"
        AuthCtrl[Auth Controller]
        UserCtrl[User Controller]
        CourseCtrl[Course Controller]
        EvalCtrl[Evaluation Controller]
    end
    
    subgraph "Business Logic Layer"
        UserModel[User Model]
        CourseModel[Course Model]
        EvalModel[Evaluation Model]
        GradeCalc[Grade Calculator]
    end
    
    subgraph "Data Layer"
        Database[(Database)]
        Files[File System]
    end
    
    %% Data flow
    Login --> AuthSvc
    Dashboard --> ApiSvc
    Forms --> ValidationSvc
    Reports --> ApiSvc
    
    AuthSvc --> AuthCtrl
    ApiSvc --> UserCtrl
    ApiSvc --> CourseCtrl
    ApiSvc --> EvalCtrl
    ValidationSvc --> AuthCtrl
    
    AuthCtrl --> UserModel
    UserCtrl --> UserModel
    CourseCtrl --> CourseModel
    EvalCtrl --> EvalModel
    EvalCtrl --> GradeCalc
    
    UserModel --> Database
    CourseModel --> Database
    EvalModel --> Database
    GradeCalc --> Database
    Reports --> Files
```

---

## 📋 **Quick Reference**

### **Use Case Summary**
- **27 Use Cases** across 6 functional areas
- **3 User Roles**: Admin (full access), Teacher (course management), Student (view only)
- **Key Workflows**: Authentication, User Management, Course Management, Evaluation, Reporting

### **Database Design**
- **5 Main Tables**: Users, Courses, Course_Enrollments, Course_Grading_Rules, Evaluations
- **Referential Integrity**: Foreign key relationships maintained
- **Data Preservation**: Student/Teacher/Course names stored in evaluations for historical accuracy

### **System Architecture**
- **Frontend**: AngularJS SPA with role-based routing
- **Backend**: Node.js/Express REST API with JWT authentication
- **Database**: SQLite (local) / PostgreSQL (production)
- **Security**: Role-based access control with middleware protection

### **Key Features**
- ✅ Role-based authentication and authorization
- ✅ Course management with student enrollment
- ✅ Flexible evaluation system with multiple types
- ✅ Weighted grade calculations
- ✅ PDF/CSV report generation
- ✅ Historical data preservation
- ✅ Responsive web interface

---

## 🔗 **External Tools for Advanced Diagrams**

1. **PlantUML Online**: http://www.plantuml.com/plantuml/
2. **Draw.io**: https://app.diagrams.net/
3. **Lucidchart**: https://www.lucidchart.com/
4. **Visual Studio Code Extensions**: 
   - PlantUML Extension
   - Mermaid Markdown Syntax Highlighting

Copy the PlantUML code from `UML_COMPREHENSIVE_DIAGRAMS.md` into any of these tools for high-quality diagram generation!
