DO $$
DECLARE
    admin_id BIGINT;
    java_course_id BIGINT;
    spring_course_id BIGINT;
    db_course_id BIGINT;
    
    java_mod1_id BIGINT;
    java_mod2_id BIGINT;
    java_mod3_id BIGINT;
    
    spring_mod1_id BIGINT;
    spring_mod2_id BIGINT;
    spring_mod3_id BIGINT;
    
    db_mod1_id BIGINT;
    db_mod2_id BIGINT;
    db_mod3_id BIGINT;
    
    q_id BIGINT;
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@skillforge.local' LIMIT 1;
    IF admin_id IS NULL THEN
        admin_id := 1;
    END IF;

    --------------------------------------------------------------------------------
    -- 1. Core Java Course
    --------------------------------------------------------------------------------
    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES ('Core Java Masterclass', 'A comprehensive guide to Core Java programming. Understand Object-Oriented principles, master the Collections framework, explore Multithreading, and learn how to write robust, efficient, and clean Java code suitable for enterprise development.', admin_id, 'APPROVED', CURRENT_TIMESTAMP)
    RETURNING id INTO java_course_id;

    -- Java Modules
    INSERT INTO learning_modules (title, course_id) VALUES ('Getting Started & Java Basics', java_course_id) RETURNING id INTO java_mod1_id;
    INSERT INTO learning_modules (title, course_id) VALUES ('Object-Oriented Programming (OOP)', java_course_id) RETURNING id INTO java_mod2_id;
    INSERT INTO learning_modules (title, course_id) VALUES ('Advanced Topics: Collections & Multithreading', java_course_id) RETURNING id INTO java_mod3_id;

    -- Java Mod 1 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('Introduction to Java', 'TEXT', '# What is Java?\nJava is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible.\n\n## Key Advantages\n- **Platform Independence:** "Write Once, Run Anywhere" (WORA).\n- **Robustness:** Strong memory management and exception handling.\n- **Security:** Security manager and lack of explicit pointers.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000', '', java_mod1_id),
    ('Variables, Data Types, and Operators', 'TEXT', '# Core Syntax\nJava is strongly typed, meaning every variable must be declared with a data type.\n\n## Primitive Types\n1. `int` (32-bit)\n2. `double` (64-bit floating point)\n3. `boolean` (true/false)\n4. `char` (16-bit Unicode character)\n\n## Operators\nArithmetic (+, -, *, /), Relational (==, !=, >, <), and Logical (&&, ||, !).', 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=1000', '', java_mod1_id);

    -- Java Mod 1 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (java_mod1_id, 'What is the characteristic of Java that makes it run anywhere?', 'Core Java', 'Basics', 'EASY', 'Platform Independent') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'Platform Dependent'), (q_id, 'Platform Independent'), (q_id, 'Interpreted Only'), (q_id, 'Compiled Only');
    
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (java_mod1_id, 'Which of the following is NOT a primitive data type in Java?', 'Core Java', 'Data Types', 'EASY', 'String') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'int'), (q_id, 'boolean'), (q_id, 'String'), (q_id, 'double');

    -- Java Mod 2 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('The 4 Pillars of OOP', 'TEXT', '# OOPs Concepts\nObject-Oriented Programming is a paradigm based on the concept of "objects".\n\n## The 4 Pillars\n1. **Abstraction**: Hiding internal implementation details.\n2. **Encapsulation**: Binding of data and code together into a single unit.\n3. **Inheritance**: Deriving a new class from an existing class to reuse code.\n4. **Polymorphism**: The ability of an object to take on many forms (e.g., method overloading and overriding).', 'https://images.unsplash.com/photo-1623479322729-28b25c16b011?auto=format&fit=crop&q=80&w=1000', '', java_mod2_id),
    ('Interfaces and Abstract Classes', 'TEXT', '# Abstraction in Java\n\n- **Abstract Classes** can have both abstract and concrete methods. They cannot be instantiated.\n- **Interfaces** (prior to Java 8) only had abstract methods. A class can implement multiple interfaces, bypassing Java''s restriction on multiple inheritance.', 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad8?auto=format&fit=crop&q=80&w=1000', '', java_mod2_id);

    -- Java Mod 2 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (java_mod2_id, 'Which concept binds data and its associated methods into a single unit?', 'Core Java', 'OOPs', 'EASY', 'Encapsulation') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'Abstraction'), (q_id, 'Inheritance'), (q_id, 'Encapsulation'), (q_id, 'Polymorphism');
    
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (java_mod2_id, 'Can a class in Java inherit from multiple classes?', 'Core Java', 'Inheritance', 'MEDIUM', 'No, Java does not support multiple inheritance for classes') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'Yes, always'), (q_id, 'Yes, but only if they are abstract classes'), (q_id, 'No, Java does not support multiple inheritance for classes'), (q_id, 'Only in Java 8 and above');

    -- Java Mod 3 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('The Collections Framework', 'TEXT', '# Java Collections\nA unified architecture for representing and manipulating collections, allowing them to be manipulated independently of the details of their representation.\n\n- **List:** Ordered collection (e.g., ArrayList, LinkedList).\n- **Set:** Collection that cannot contain duplicates (e.g., HashSet, TreeSet).\n- **Map:** An object that maps keys to values (e.g., HashMap, TreeMap).', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000', '', java_mod3_id),
    ('Multithreading and Concurrency', 'TEXT', '# Concurrency in Java\nMultithreading is the process of executing multiple threads simultaneously. It minimizes CPU overhead and maximizes CPU utilization.\n\n- Implement `Runnable` or extend `Thread`.\n- Utilize `java.util.concurrent` package for modern concurrent programming (`ExecutorService`, `Future`, etc.).', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000', '', java_mod3_id);

    -- Java Mod 3 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (java_mod3_id, 'Which interface does ArrayList implement?', 'Core Java', 'Collections', 'MEDIUM', 'List') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'List'), (q_id, 'Set'), (q_id, 'Map'), (q_id, 'Queue');
    
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (java_mod3_id, 'Which interface prevents duplicate elements?', 'Core Java', 'Collections', 'MEDIUM', 'Set') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'List'), (q_id, 'Set'), (q_id, 'Map'), (q_id, 'Queue');


    --------------------------------------------------------------------------------
    -- 2. Spring Boot Course
    --------------------------------------------------------------------------------
    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES ('Spring Boot & Microservices Masterclass', 'Dive deep into the Spring ecosystem. Learn to build enterprise-grade REST APIs, handle database interactions with Spring Data JPA, secure applications with Spring Security, and architect scalable microservices.', admin_id, 'APPROVED', CURRENT_TIMESTAMP)
    RETURNING id INTO spring_course_id;

    -- Spring Boot Modules
    INSERT INTO learning_modules (title, course_id) VALUES ('Introduction & Core Concepts', spring_course_id) RETURNING id INTO spring_mod1_id;
    INSERT INTO learning_modules (title, course_id) VALUES ('Building RESTful APIs', spring_course_id) RETURNING id INTO spring_mod2_id;
    INSERT INTO learning_modules (title, course_id) VALUES ('Data Persistence & Security', spring_course_id) RETURNING id INTO spring_mod3_id;

    -- Spring Boot Mod 1 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('What is Spring Boot?', 'TEXT', '# Spring Boot Magic\nSpring Boot simplifies the bootstrapping and development of a new Spring application. It takes an opinionated approach to configuration, freeing developers from boilerplate code.\n\n## Auto-configuration\nAutomatically configures your application based on the dependencies present on the classpath.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000', '', spring_mod1_id),
    ('Dependency Injection & IoC', 'TEXT', '# Inversion of Control\nIoC is a design principle where the control of object creation is inverted. Spring''s IoC container is responsible for instantiating, configuring, and assembling objects known as *beans*.\n\n`@Autowired` is commonly used for injecting dependencies automatically.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000', '', spring_mod1_id);

    -- Spring Boot Mod 1 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (spring_mod1_id, 'Which annotation is used to bootstrap a Spring Boot application?', 'Spring Boot', 'Basics', 'EASY', '@SpringBootApplication') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, '@SpringBootApplication'), (q_id, '@EnableAutoConfiguration'), (q_id, '@ComponentScan'), (q_id, '@Configuration');
    
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (spring_mod1_id, 'What is the primary role of the Spring IoC container?', 'Spring Boot', 'IoC', 'MEDIUM', 'To instantiate, configure, and manage lifecycle of beans') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'To handle HTTP requests'), (q_id, 'To connect to the database'), (q_id, 'To instantiate, configure, and manage lifecycle of beans'), (q_id, 'To render HTML views');

    -- Spring Boot Mod 2 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('REST Controllers & Routing', 'TEXT', '# Exposing APIs\nIn Spring Boot, `@RestController` combines `@Controller` and `@ResponseBody`. It signals that incoming HTTP requests should be handled and the result should be bound directly to the web response body.\n\n- `@GetMapping` for READ.\n- `@PostMapping` for CREATE.\n- `@PutMapping` for UPDATE.\n- `@DeleteMapping` for DELETE.', 'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?auto=format&fit=crop&q=80&w=1000', '', spring_mod2_id);

    -- Spring Boot Mod 2 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (spring_mod2_id, 'Which annotation maps HTTP GET requests onto specific handler methods?', 'Spring Boot', 'REST API', 'EASY', '@GetMapping') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, '@PostMapping'), (q_id, '@RequestMapping'), (q_id, '@GetMapping'), (q_id, '@PutMapping');

    -- Spring Boot Mod 3 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('Spring Data JPA', 'TEXT', '# Database Interactions\nSpring Data JPA significantly reduces the amount of boilerplate code required to implement data access layers.\n\nBy simply extending an interface like `JpaRepository`, you get full CRUD operations without writing any implementation logic.', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=1000', '', spring_mod3_id);

    -- Spring Boot Mod 3 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (spring_mod3_id, 'Which interface provides basic CRUD operations in Spring Data JPA?', 'Spring Boot', 'JPA', 'MEDIUM', 'CrudRepository/JpaRepository') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'CrudRepository/JpaRepository'), (q_id, 'EntityManager'), (q_id, 'JdbcTemplate'), (q_id, 'Session');


    --------------------------------------------------------------------------------
    -- 3. Databases & SQL Course
    --------------------------------------------------------------------------------
    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES ('Relational Databases & Advanced SQL', 'Master database design, understand inner workings of storage engines, write highly optimized SQL queries, and explore advanced concepts like indexing, transactions, and normalization.', admin_id, 'APPROVED', CURRENT_TIMESTAMP)
    RETURNING id INTO db_course_id;

    -- DB Modules
    INSERT INTO learning_modules (title, course_id) VALUES ('Relational Concepts & Basic SQL', db_course_id) RETURNING id INTO db_mod1_id;
    INSERT INTO learning_modules (title, course_id) VALUES ('Advanced Querying & Joins', db_course_id) RETURNING id INTO db_mod2_id;
    INSERT INTO learning_modules (title, course_id) VALUES ('Transactions & Indexing', db_course_id) RETURNING id INTO db_mod3_id;

    -- DB Mod 1 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('Introduction to RDBMS', 'TEXT', '# What is an RDBMS?\nA Relational Database Management System (RDBMS) is a DBMS designed specifically for relational databases. Data is structured using tables, records (rows), and fields (columns).\n\nPrimary Keys ensure unique identification of rows, while Foreign Keys establish relationships between tables.', 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=1000', '', db_mod1_id),
    ('Basic CRUD Operations', 'TEXT', '# SQL Syntax\n- **C**reate: `INSERT INTO table (columns) VALUES (data);`\n- **R**ead: `SELECT * FROM table;`\n- **U**pdate: `UPDATE table SET column=value;`\n- **D**elete: `DELETE FROM table WHERE condition;`', 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1000', '', db_mod1_id);

    -- DB Mod 1 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (db_mod1_id, 'What does SQL stand for?', 'Database', 'SQL basics', 'EASY', 'Structured Query Language') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'Structured Question Language'), (q_id, 'Structured Query Language'), (q_id, 'Strong Question Language'), (q_id, 'Simple Query Language');
    
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (db_mod1_id, 'Which SQL statement is used to extract data from a database?', 'Database', 'SQL basics', 'EASY', 'SELECT') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'GET'), (q_id, 'OPEN'), (q_id, 'EXTRACT'), (q_id, 'SELECT');

    -- DB Mod 2 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('Demystifying Joins', 'TEXT', '# SQL Joins\nCombining rows from two or more tables.\n\n## INNER JOIN\nReturns records that have matching values in both tables.\n\n## LEFT JOIN\nReturns all records from the left table, and the matched records from the right table. The result is 0 records from the right side, if there is no match.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000', '', db_mod2_id);

    -- DB Mod 2 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (db_mod2_id, 'Which JOIN returns all records from the left table, and the matched records from the right table?', 'Database', 'SQL Joins', 'MEDIUM', 'LEFT JOIN') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'INNER JOIN'), (q_id, 'CROSS JOIN'), (q_id, 'RIGHT JOIN'), (q_id, 'LEFT JOIN');
    
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (db_mod2_id, 'What will be the result of a CROSS JOIN on two tables with 3 and 4 rows respectively?', 'Database', 'SQL Joins', 'HARD', '12 rows') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, '7 rows'), (q_id, '12 rows'), (q_id, '1 row'), (q_id, '0 rows');

    -- DB Mod 3 Lessons
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES 
    ('ACID Properties & Transactions', 'TEXT', '# ACID Properties\nTo maintain data integrity, database transactions must adhere to:\n\n1. **Atomicity**: All or nothing.\n2. **Consistency**: Data moves from one valid state to another.\n3. **Isolation**: Concurrent transactions do not affect each other.\n4. **Durability**: Committed data is persisted permanently.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000', '', db_mod3_id);

    -- DB Mod 3 Questions
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer) VALUES 
    (db_mod3_id, 'Which ACID property guarantees that a transaction is treated as a single, indivisible logical unit of work?', 'Database', 'ACID', 'MEDIUM', 'Atomicity') RETURNING id INTO q_id;
    INSERT INTO question_options (question_id, option_value) VALUES (q_id, 'Atomicity'), (q_id, 'Consistency'), (q_id, 'Isolation'), (q_id, 'Durability');

END $$;
