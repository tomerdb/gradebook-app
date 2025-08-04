# Grade Book Application - Visual UML Diagrams

## How to Generate Visual Diagrams

The UML diagrams in this project use Mermaid syntax, which can be rendered as images in several ways:

### Option 1: GitHub (Automatic Rendering)
When you push this to GitHub, the Mermaid diagrams will automatically render as images in the README and UML_DIAGRAM.md files.

### Option 2: VS Code with Mermaid Extension
1. Install the "Mermaid Preview" extension in VS Code
2. Open `UML_DIAGRAM.md`
3. Use Ctrl+Shift+P → "Mermaid: Preview"
4. Export as PNG/SVG

### Option 3: Online Mermaid Editor
1. Go to https://mermaid.live/
2. Copy the Mermaid code from `UML_DIAGRAM.md`
3. Paste it in the editor
4. Download as PNG/SVG

### Option 4: PlantUML Alternative Diagrams

Here are the same diagrams in PlantUML format for generating images:

## Database Schema (PlantUML)

```plantuml
@startuml database_schema
!define ENTITY class
!define PK <<PK>>
!define FK <<FK>>

ENTITY USERS {
  +id: int PK
  +name: string
  +email: string
  +password: string
  +role: string
  +created_at: datetime
}

ENTITY COURSES {
  +id: int PK
  +name: string
  +description: string
  +teacher_id: int FK
  +created_at: datetime
}

ENTITY COURSE_ENROLLMENTS {
  +id: int PK
  +course_id: int FK
  +student_id: int FK
  +enrolled_at: datetime
}

ENTITY COURSE_GRADING_RULES {
  +id: int PK
  +course_id: int FK
  +evaluation_type: string
  +weight: float
}

ENTITY EVALUATIONS {
  +id: int PK
  +student_id: int FK
  +teacher_id: int FK
  +course_id: int FK
  +evaluation_type: string
  +score: float
  +max_score: float
  +notes: string
  +student_name: string
  +teacher_name: string
  +course_name: string
  +created_at: datetime
}

USERS ||--o{ COURSES : teaches
USERS ||--o{ COURSE_ENROLLMENTS : enrolls
COURSES ||--o{ COURSE_ENROLLMENTS : has_students
COURSES ||--o{ COURSE_GRADING_RULES : has_rules
COURSES ||--o{ EVALUATIONS : contains
USERS ||--o{ EVALUATIONS : receives/gives

@enduml
```

## Backend Architecture (PlantUML)

```plantuml
@startuml backend_architecture
!theme plain

package "Express Application" {
  class App {
    +express: Express
    +port: number
    +start(): void
    +setupMiddleware(): void
    +setupRoutes(): void
  }
}

package "Middleware" {
  class AuthMiddleware {
    +JWT_SECRET: string
    +verifyToken(req, res, next): void
    +adminOnly(req, res, next): void
    +teacherOnly(req, res, next): void
    +studentOnly(req, res, next): void
  }
}

package "Controllers" {
  class AuthController {
    +login(req, res): Promise
    +register(req, res): Promise
    +verifyToken(req, res): Promise
  }
  
  class UsersController {
    +getAll(req, res): Promise
    +create(req, res): Promise
    +update(req, res): Promise
    +delete(req, res): Promise
  }
  
  class CoursesController {
    +getAll(req, res): Promise
    +create(req, res): Promise
    +enroll(req, res): Promise
    +setGradingRules(req, res): Promise
  }
  
  class EvaluationsController {
    +getAll(req, res): Promise
    +create(req, res): Promise
    +exportPDF(req, res): Promise
    +exportCSV(req, res): Promise
  }
}

package "Models" {
  class DatabaseModels {
    +db: SQLite3
    +initializeDatabase(): void
    +createTables(): void
  }
  
  class UserModel {
    +id: number
    +name: string
    +email: string
    +role: string
  }
  
  class CourseModel {
    +id: number
    +name: string
    +teacher_id: number
  }
  
  class EvaluationModel {
    +id: number
    +student_id: number
    +teacher_id: number
    +course_id: number
    +score: number
  }
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

@enduml
```

## Frontend Architecture (PlantUML)

```plantuml
@startuml frontend_architecture
!theme plain

package "AngularJS Application" {
  class AngularApp {
    +module: gradeBookApp
    +routing: config
    +run(): void
  }
}

package "Services" {
  class AuthService {
    +login(credentials): Promise
    +logout(): void
    +getToken(): string
    +isAuthenticated(): boolean
  }
  
  class ApiService {
    +API_BASE: string
    +getAuthHeaders(): object
    +users: UserAPI
    +courses: CourseAPI
    +evaluations: EvaluationAPI
  }
}

package "Controllers" {
  class AuthController {
    +login(): void
    +logout(): void
  }
  
  class AdminController {
    +users: Array
    +courses: Array
    +loadUsers(): void
    +createUser(): void
    +manageCourses(): void
  }
  
  class TeacherController {
    +courses: Array
    +evaluations: Array
    +createEvaluation(): void
    +exportPDF(): void
  }
  
  class StudentController {
    +evaluations: Array
    +grades: object
    +downloadGradesheet(): void
  }
}

AngularApp --> AuthService
AngularApp --> ApiService
AngularApp --> AuthController
AngularApp --> AdminController
AngularApp --> TeacherController
AngularApp --> StudentController

AdminController --> AuthService
AdminController --> ApiService
TeacherController --> AuthService
TeacherController --> ApiService
StudentController --> AuthService
StudentController --> ApiService

@enduml
```

## System Flow (PlantUML)

```plantuml
@startuml system_flow
!theme plain

actor User
participant Frontend
participant "Auth Middleware" as Auth
participant Controller
participant Database
participant "PDF Generator" as PDF

User -> Frontend: Login Request
Frontend -> Auth: POST /api/auth/login
Auth -> Database: Validate Credentials
Database --> Auth: User Data
Auth --> Frontend: JWT Token
Frontend --> User: Login Success

User -> Frontend: Create Evaluation
Frontend -> Auth: POST /api/evaluations (JWT)
Auth -> Auth: Verify Token & Role
Auth -> Controller: Forward Request
Controller -> Database: Insert Evaluation
Controller -> Database: Fetch Names
Database --> Controller: Evaluation Created
Controller --> Frontend: Success Response
Frontend --> User: Evaluation Created

User -> Frontend: Export PDF
Frontend -> Auth: GET /api/evaluations/export-pdf
Auth -> Auth: Verify Token & Role
Auth -> Controller: Forward Request
Controller -> Database: Fetch Data
Database --> Controller: Evaluation Data
Controller -> PDF: Generate PDF
PDF --> Controller: PDF Buffer
Controller --> Frontend: PDF File
Frontend --> User: Download PDF

@enduml
```

## Role-Based Access (PlantUML)

```plantuml
@startuml role_access
!theme plain

package "User Roles" {
  actor Admin
  actor Teacher
  actor Student
}

package "Admin Permissions" {
  usecase "Manage Users" as AdminUsers
  usecase "Manage Courses" as AdminCourses
  usecase "View All Reports" as AdminReports
  usecase "Export All Data" as AdminExport
}

package "Teacher Permissions" {
  usecase "View Assigned Courses" as TeacherCourses
  usecase "Create Evaluations" as TeacherEval
  usecase "View Course Reports" as TeacherReports
  usecase "Export Course Data" as TeacherExport
}

package "Student Permissions" {
  usecase "View Own Grades" as StudentGrades
  usecase "View Enrolled Courses" as StudentCourses
  usecase "Download Gradesheet" as StudentPDF
}

Admin --> AdminUsers
Admin --> AdminCourses
Admin --> AdminReports
Admin --> AdminExport
Admin --> TeacherCourses
Admin --> TeacherEval
Admin --> TeacherReports
Admin --> TeacherExport

Teacher --> TeacherCourses
Teacher --> TeacherEval
Teacher --> TeacherReports
Teacher --> TeacherExport

Student --> StudentGrades
Student --> StudentCourses
Student --> StudentPDF

@enduml
```

## To Generate Images:

### Method 1: PlantUML Online
1. Go to http://www.plantuml.com/plantuml/uml/
2. Copy any of the PlantUML code blocks above
3. Paste and generate PNG/SVG

### Method 2: PlantUML Extension for VS Code
1. Install "PlantUML" extension
2. Create .puml files with the code above
3. Use Alt+D to preview
4. Export as images

### Method 3: Command Line (if you have PlantUML installed)
```bash
plantuml -tpng diagram.puml
```

### Method 4: GitHub Integration
The Mermaid diagrams in UML_DIAGRAM.md will automatically render as images when viewed on GitHub.

## Quick Image Generation Links:

For immediate image generation, you can use these online tools:
- **Mermaid Live**: https://mermaid.live/
- **PlantUML Online**: http://www.plantuml.com/plantuml/
- **Draw.io**: https://app.diagrams.net/ (manual recreation)

The diagrams above provide complete visual documentation of your Grade Book application architecture!
