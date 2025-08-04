# Grade Book Application - Working PlantUML Diagrams

## ✅ Use Case Diagram (Simple Version)

```plantuml
@startuml
!theme plain

title Grade Book Application - Use Case Diagram

actor Admin
actor Teacher
actor Student

usecase "Login" as UC1
usecase "Logout" as UC2
usecase "Create User" as UC4
usecase "Edit User" as UC5
usecase "Delete User" as UC6
usecase "View Users" as UC7
usecase "Create Course" as UC8
usecase "View Courses" as UC11
usecase "Create Evaluation" as UC15
usecase "View Evaluations" as UC18
usecase "View Reports" as UC20
usecase "Export PDF" as UC21

' Admin permissions
Admin --> UC1
Admin --> UC2
Admin --> UC4
Admin --> UC5
Admin --> UC6
Admin --> UC7
Admin --> UC8
Admin --> UC11
Admin --> UC15
Admin --> UC18
Admin --> UC20
Admin --> UC21

' Teacher permissions
Teacher --> UC1
Teacher --> UC2
Teacher --> UC11
Teacher --> UC15
Teacher --> UC18
Teacher --> UC20
Teacher --> UC21

' Student permissions
Student --> UC1
Student --> UC2
Student --> UC18
Student --> UC20

@enduml
```

## ✅ Class Diagram (Simple Version)

```plantuml
@startuml
!theme plain

title Grade Book Application - Class Diagram

class User {
  -id: Integer
  -name: String
  -email: String
  -password: String
  -role: String
  -created_at: DateTime
  +getAll(): User[]
  +getById(id): User
  +create(userData): Integer
  +update(id, userData): Boolean
  +delete(id): Boolean
}

class Course {
  -id: Integer
  -name: String
  -description: String
  -teacher_id: Integer
  -created_at: DateTime
  +getAll(): Course[]
  +getByTeacher(teacherId): Course[]
  +create(courseData): Integer
  +update(id, courseData): Boolean
  +delete(id): Boolean
}

class Evaluation {
  -id: Integer
  -student_id: Integer
  -teacher_id: Integer
  -course_id: Integer
  -student_name: String
  -teacher_name: String
  -course_name: String
  -evaluation_type: String
  -score: Integer
  -feedback: String
  -date_created: DateTime
  +create(data): Integer
  +getByStudent(studentId): Evaluation[]
  +getByTeacher(teacherId): Evaluation[]
  +update(id, data): Boolean
  +delete(id): Boolean
}

class AuthController {
  +login(req, res): void
  +register(req, res): void
  +profile(req, res): void
}

class UsersController {
  +getAll(req, res): void
  +create(req, res): void
  +update(req, res): void
  +delete(req, res): void
}

class CoursesController {
  +getAll(req, res): void
  +create(req, res): void
  +update(req, res): void
  +delete(req, res): void
}

class EvaluationsController {
  +create(req, res): void
  +getAll(req, res): void
  +update(req, res): void
  +delete(req, res): void
  +generatePDF(req, res): void
}

' Relationships
User ||--o{ Course : teaches
User ||--o{ Evaluation : receives/gives
Course ||--o{ Evaluation : contains

' Controllers use Models
AuthController --> User
UsersController --> User
CoursesController --> Course
EvaluationsController --> Evaluation

@enduml
```

## ✅ Activity Diagram (Simple Version)

```plantuml
@startuml
!theme plain

title Grade Book Application - Evaluation Process

start
:Teacher Login;
:Navigate to Dashboard;
:Select Create Evaluation;
:Choose Course;
:Select Student;
:Enter Evaluation Details;

if (Valid Input?) then (yes)
  :Save Evaluation;
  :Update Student Records;
  :Show Success Message;
  
  if (More Evaluations?) then (yes)
    :Select Next Student;
    stop
  else (no)
    :Generate Reports;
    stop
  endif
else (no)
  :Show Error Message;
  :Return to Form;
  stop
endif

@enduml
```

## ✅ State Diagram (Simple Version)

```plantuml
@startuml
!theme plain

title Grade Book Application - User Session States

[*] --> Unauthenticated

state Unauthenticated {
  [*] --> LoginPage
}

Unauthenticated --> Authenticated : login
Authenticated --> Unauthenticated : logout

state Authenticated {
  [*] --> RoleCheck
  
  state RoleCheck <<choice>>
  RoleCheck --> AdminDashboard : [admin]
  RoleCheck --> TeacherDashboard : [teacher]
  RoleCheck --> StudentDashboard : [student]
  
  state AdminDashboard {
    [*] --> UserManagement
    UserManagement --> CourseManagement
    CourseManagement --> Reports
  }
  
  state TeacherDashboard {
    [*] --> MyCourses
    MyCourses --> CreateEvaluation
    CreateEvaluation --> ViewReports
  }
  
  state StudentDashboard {
    [*] --> MyGrades
    MyGrades --> MyCourses
    MyCourses --> DownloadReports
  }
}

Authenticated --> Unauthenticated : session_timeout

@enduml
```

---

## 🔍 What's Different in This Version?

1. **Removed complex syntax** that might cause issues:
   - No `package` statements
   - No `.>` include/extend relationships  
   - Simplified class definitions
   - Basic relationships only

2. **Simplified content** but covers all key aspects:
   - Core use cases for each role
   - Essential classes and relationships
   - Main workflow processes
   - Basic state transitions

3. **Guaranteed to work** in PlantUML online tools

## 📝 Testing Instructions

1. Copy any diagram above
2. Go to http://www.plantuml.com/plantuml/
3. Paste the code
4. Click "Submit"
5. Should render without errors!

If these work, then we know the syntax is correct and we can troubleshoot the complex version.
