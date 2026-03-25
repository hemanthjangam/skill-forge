CREATE OR REPLACE FUNCTION sf_seed_question(
    p_module_id BIGINT,
    p_statement TEXT,
    p_topic TEXT,
    p_concept TEXT,
    p_difficulty VARCHAR(50),
    p_correct_answer TEXT,
    p_options TEXT[]
) RETURNS VOID AS $$
DECLARE
    q_id BIGINT;
BEGIN
    INSERT INTO question (module_id, statement, topic, concept, difficulty, correct_answer)
    VALUES (p_module_id, p_statement, p_topic, p_concept, p_difficulty, p_correct_answer)
    RETURNING id INTO q_id;

    INSERT INTO question_options (question_id, option_value)
    SELECT q_id, option_value
    FROM unnest(p_options) AS option_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sf_seed_concept_pool(
    p_module_id BIGINT,
    p_topic TEXT,
    p_concepts TEXT[]
) RETURNS VOID AS $$
DECLARE
    concept TEXT;
    idx INTEGER := 1;
    difficulty VARCHAR(50);
BEGIN
    FOREACH concept IN ARRAY p_concepts LOOP
        difficulty := CASE
            WHEN idx <= 2 THEN 'EASY'
            WHEN idx <= 4 THEN 'MEDIUM'
            ELSE 'HARD'
        END;

        PERFORM sf_seed_question(
            p_module_id,
            format('Which practice most directly strengthens %s in the %s module?', concept, p_topic),
            p_topic,
            concept,
            difficulty,
            format('Applying %s deliberately in the project workflow', concept),
            ARRAY[
                format('Applying %s deliberately in the project workflow', concept),
                'Skipping validation to move faster',
                'Ignoring production feedback',
                'Avoiding documentation and review'
            ]
        );

        PERFORM sf_seed_question(
            p_module_id,
            format('When reviewing a project in %s, what should be checked to confirm %s is working well?', p_topic, concept),
            p_topic,
            concept,
            difficulty,
            format('%s metrics, behavior, and trade-offs', concept),
            ARRAY[
                format('%s metrics, behavior, and trade-offs', concept),
                'Only the repository name',
                'Only the final screenshot',
                'Only the team size'
            ]
        );

        idx := idx + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

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

    react_course_id BIGINT;
    spring_proj_course_id BIGINT;
    devops_course_id BIGINT;
    data_course_id BIGINT;
    cloud_course_id BIGINT;

    module_id BIGINT;
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'admin@skillforge.local' LIMIT 1;
    IF admin_id IS NULL THEN
        admin_id := 1;
    END IF;

    SELECT id INTO java_course_id FROM course WHERE title = 'Core Java Masterclass' LIMIT 1;
    SELECT id INTO spring_course_id FROM course WHERE title = 'Spring Boot & Microservices Masterclass' LIMIT 1;
    SELECT id INTO db_course_id FROM course WHERE title = 'Relational Databases & Advanced SQL' LIMIT 1;

    SELECT lm.id INTO java_mod1_id FROM learning_modules lm WHERE lm.course_id = java_course_id AND lm.title = 'Getting Started & Java Basics' LIMIT 1;
    SELECT lm.id INTO java_mod2_id FROM learning_modules lm WHERE lm.course_id = java_course_id AND lm.title = 'Object-Oriented Programming (OOP)' LIMIT 1;
    SELECT lm.id INTO java_mod3_id FROM learning_modules lm WHERE lm.course_id = java_course_id AND lm.title = 'Advanced Topics: Collections & Multithreading' LIMIT 1;

    SELECT lm.id INTO spring_mod1_id FROM learning_modules lm WHERE lm.course_id = spring_course_id AND lm.title = 'Introduction & Core Concepts' LIMIT 1;
    SELECT lm.id INTO spring_mod2_id FROM learning_modules lm WHERE lm.course_id = spring_course_id AND lm.title = 'Building RESTful APIs' LIMIT 1;
    SELECT lm.id INTO spring_mod3_id FROM learning_modules lm WHERE lm.course_id = spring_course_id AND lm.title = 'Data Persistence & Security' LIMIT 1;

    SELECT lm.id INTO db_mod1_id FROM learning_modules lm WHERE lm.course_id = db_course_id AND lm.title = 'Relational Concepts & Basic SQL' LIMIT 1;
    SELECT lm.id INTO db_mod2_id FROM learning_modules lm WHERE lm.course_id = db_course_id AND lm.title = 'Advanced Querying & Joins' LIMIT 1;
    SELECT lm.id INTO db_mod3_id FROM learning_modules lm WHERE lm.course_id = db_course_id AND lm.title = 'Transactions & Indexing' LIMIT 1;

    IF java_mod1_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(java_mod1_id, 'Getting Started & Java Basics',
            ARRAY['JVM lifecycle', 'primitive types', 'control flow', 'methods', 'exception basics']);
    END IF;
    IF java_mod2_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(java_mod2_id, 'Object-Oriented Programming (OOP)',
            ARRAY['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'interface design']);
    END IF;
    IF java_mod3_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(java_mod3_id, 'Advanced Topics: Collections & Multithreading',
            ARRAY['list vs set', 'map semantics', 'thread safety', 'executors', 'concurrency pitfalls']);
    END IF;

    IF spring_mod1_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(spring_mod1_id, 'Introduction & Core Concepts',
            ARRAY['auto-configuration', 'dependency injection', 'bean lifecycle', 'profiles', 'externalized config']);
    END IF;
    IF spring_mod2_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(spring_mod2_id, 'Building RESTful APIs',
            ARRAY['resource routing', 'validation', 'status codes', 'DTO mapping', 'exception handling']);
    END IF;
    IF spring_mod3_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(spring_mod3_id, 'Data Persistence & Security',
            ARRAY['repository design', 'entity mapping', 'transaction boundaries', 'authentication', 'authorization']);
    END IF;

    IF db_mod1_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(db_mod1_id, 'Relational Concepts & Basic SQL',
            ARRAY['primary keys', 'foreign keys', 'normalization', 'CRUD statements', 'filtering data']);
    END IF;
    IF db_mod2_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(db_mod2_id, 'Advanced Querying & Joins',
            ARRAY['inner joins', 'outer joins', 'aggregation', 'window functions', 'query planning']);
    END IF;
    IF db_mod3_id IS NOT NULL THEN
        PERFORM sf_seed_concept_pool(db_mod3_id, 'Transactions & Indexing',
            ARRAY['ACID', 'locking', 'isolation levels', 'index strategy', 'performance analysis']);
    END IF;

    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES (
        'React Product Engineering Projects',
        'A project-heavy frontend course focused on shipping production-grade React features. You will design feature slices, state flows, component systems, forms, async data layers, and performance budgets while building realistic product modules.',
        admin_id,
        'APPROVED',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO react_course_id;

    INSERT INTO learning_modules (title, course_id) VALUES ('Designing the Product Shell', react_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Information Architecture for Dashboards', 'TEXT', 'Map the dashboard before writing components. Define navigation landmarks, page goals, user actions, and state boundaries. A strong shell keeps feature teams aligned because layouts, spacing, and page-level affordances become predictable across views. Capture mobile constraints early, identify the highest-frequency actions, and document what must remain visible during loading, errors, and partial updates.', '', '', module_id),
    ('Building Reusable Layout Primitives', 'TEXT', 'Create primitives for section headers, metric cards, panel containers, empty states, and responsive gutters. These abstractions should remove repetition without hiding meaning. The rule is simple: share patterns, not confusion. When a primitive is introduced, list the invariants it owns such as padding rhythm, semantic heading level, and slot structure.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Designing the Product Shell', ARRAY['layout hierarchy', 'responsive composition', 'navigation clarity', 'empty states', 'loading strategy']);

    INSERT INTO learning_modules (title, course_id) VALUES ('State, Forms, and Mutations', react_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Form Workflows with Validation', 'TEXT', 'Treat forms as workflows rather than pages with inputs. Start from the business rule set: required fields, valid transitions, optimistic affordances, server reconciliation, and recovery after a failed save. Users should always understand which fields are invalid, what changed, and whether their draft is safe.', '', '', module_id),
    ('Mutation UX and Cache Invalidation', 'TEXT', 'Every mutation changes trust. After a save or delete, the interface must reflect the new truth immediately or explain what is still pending. Define invalidation keys, optimistic updates, rollback behavior, and destructive-action confirmations. The goal is not just correctness but confidence in the product.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'State, Forms, and Mutations', ARRAY['controlled inputs', 'validation rules', 'optimistic updates', 'cache invalidation', 'error recovery']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Feature Delivery with Data Fetching', react_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Query Lifecycles and Server State', 'TEXT', 'A data-driven product lives or dies by how it handles loading, stale state, and refresh timing. Define query ownership per screen, shape loading skeletons that preserve layout, and avoid duplicated fetches across nested views. Server state must be modeled distinctly from local UI state so refreshes do not corrupt interaction state.', '', '', module_id),
    ('Error Boundaries and Recovery Paths', 'TEXT', 'Real products fail in partial ways. Instead of a global crash page, design layered recovery: local panel reloads, retry affordances, preserved filters, and fallback states that teach users what remains available. Error boundaries should reduce blast radius, not just hide stack traces.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Feature Delivery with Data Fetching', ARRAY['query ownership', 'stale data handling', 'retry strategy', 'skeleton states', 'error boundaries']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Performance and Shipping Discipline', react_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Rendering Budgets and Profiling', 'TEXT', 'Performance work begins with budgets. Define acceptable render cost for critical pages, identify interaction hot paths, and profile before changing architecture. Measure expensive trees, understand why props churn, and decide whether state placement, virtualization, or code splitting is the right lever.', '', '', module_id),
    ('Release Readiness for Frontend Teams', 'TEXT', 'Before shipping, verify accessibility, loading behavior, empty states, destructive flows, observability, and fallback UX. Release readiness is a checklist of user risk. A polished feature is one that behaves correctly on the second day of use, not only in the happy path demo.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Performance and Shipping Discipline', ARRAY['profiling', 'bundle strategy', 'virtualization', 'accessibility checks', 'release readiness']);

    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES (
        'Spring Boot API Delivery Projects',
        'A backend implementation course built around realistic service modules. Students build API contracts, persistence layers, approval workflows, async jobs, and secure operational endpoints while making trade-offs that matter in production.',
        admin_id,
        'APPROVED',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO spring_proj_course_id;

    INSERT INTO learning_modules (title, course_id) VALUES ('Domain Modeling and API Contracts', spring_proj_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Designing Stable Request and Response Models', 'TEXT', 'Start from the consumer experience. Contracts should expose clear names, explicit validation rules, and fields that reflect workflow intent rather than database shape. Stable APIs come from separating domain language from persistence shortcuts and documenting what each state transition means for clients.', '', '', module_id),
    ('Aggregates, Boundaries, and Ownership', 'TEXT', 'A service stays maintainable when boundaries are explicit. Decide which aggregate owns status changes, how child collections are modified, where invariants are enforced, and when asynchronous follow-up work is acceptable. If ownership is vague, bugs show up as double writes and inconsistent reads.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Domain Modeling and API Contracts', ARRAY['aggregate design', 'DTO boundaries', 'validation rules', 'state transitions', 'ownership']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Persistence, Queries, and Transactions', spring_proj_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Repository Design Beyond CRUD', 'TEXT', 'Repositories should expose query intent, not leak ad hoc filtering everywhere. Define the read models each screen needs, choose when pagination belongs in the API, and avoid accidental n+1 loading by shaping access patterns around actual workflows.', '', '', module_id),
    ('Transaction Boundaries Under Real Workflows', 'TEXT', 'Transaction design is operational design. Keep critical changes atomic, isolate long-running work, and make side effects explicit. A workflow with approval, notification, and audit updates should reveal which parts must commit together and which can fail independently.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Persistence, Queries, and Transactions', ARRAY['query intent', 'pagination', 'fetch strategy', 'transaction scope', 'consistency']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Security and Operational Guarantees', spring_proj_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Authentication, Authorization, and Role Edges', 'TEXT', 'Security is not just adding a filter. Define who can read, write, approve, or delete each resource, and decide how these checks stay close to business rules. Edge cases matter: disabled users, expired tokens, trainer ownership, and admin override paths all need intentional handling.', '', '', module_id),
    ('Observability, Audits, and Failures', 'TEXT', 'Operational guarantees come from traceability. Log business events, capture why critical state changed, and expose enough context to debug without leaking secrets. Audits and notifications should help explain behavior after the fact instead of adding noise.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Security and Operational Guarantees', ARRAY['authentication', 'authorization', 'ownership checks', 'audit trails', 'operational logging']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Async Workflows and Scale Readiness', spring_proj_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Background Jobs and Event Follow-up', 'TEXT', 'Move non-critical work off the request path when latency or reliability demands it. Identify safe background tasks, define retry semantics, and ensure events are idempotent. Async systems fail most often when ownership and retry guarantees are left implicit.', '', '', module_id),
    ('Preparing an API for Growth', 'TEXT', 'Scale readiness is often about eliminating hidden assumptions. Review pagination defaults, payload sizes, dashboard summary queries, and approval bottlenecks. The fastest path to resilience is usually clearer boundaries, narrower contracts, and better metrics.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Async Workflows and Scale Readiness', ARRAY['background jobs', 'idempotency', 'retry policy', 'throughput planning', 'latency control']);

    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES (
        'DevOps Delivery Pipelines and Team Operations',
        'A practical DevOps course that treats delivery as an engineered product. Students build pipelines, artifact strategies, environment promotion rules, monitoring, rollback plans, and team-safe operational playbooks around project releases.',
        admin_id,
        'APPROVED',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO devops_course_id;

    INSERT INTO learning_modules (title, course_id) VALUES ('Source Control and Build Pipelines', devops_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Branch Strategy for Product Teams', 'TEXT', 'Version control is a collaboration design problem. Choose branching rules that fit release cadence, hotfix pressure, and team size. The right model reduces merge risk, makes review ownership obvious, and preserves deployable history without slowing the team.', '', '', module_id),
    ('Build Reproducibility and Artifact Discipline', 'TEXT', 'A pipeline is only trustworthy when builds are reproducible. Lock dependency strategy, define artifact naming, store provenance, and ensure the same build can move between environments. Reproducibility is the baseline for debugging, rollback, and release auditability.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Source Control and Build Pipelines', ARRAY['branch strategy', 'artifact versioning', 'build reproducibility', 'review gates', 'pipeline triggers']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Continuous Integration Quality Gates', devops_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Testing Layers in CI', 'TEXT', 'CI should answer whether code is safe to merge, not whether it compiles. Build a layered gate strategy with unit checks, migration validation, API contracts, linting, and smoke coverage. When a failure happens, developers should know exactly what risk was detected and how to reproduce it locally.', '', '', module_id),
    ('Fast Feedback Without Shallow Coverage', 'TEXT', 'Pipelines must stay fast enough to influence behavior. Split heavyweight checks from merge-critical checks, parallelize where possible, and maintain a clear path for deep verification. Speed matters only when it still protects the main branch.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Continuous Integration Quality Gates', ARRAY['test layers', 'merge safety', 'parallel jobs', 'feedback loops', 'pipeline reliability']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Deployments, Rollbacks, and Releases', devops_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Environment Promotion and Release Control', 'TEXT', 'Promotion rules convert a collection of environments into a coherent release system. Define what must be validated before promotion, how secrets are handled, and which environment-specific checks catch expensive mistakes before production.', '', '', module_id),
    ('Rollback Planning as a First-Class Practice', 'TEXT', 'Rollback is part of deployment, not a separate emergency concept. Decide what can be reversed quickly, what requires data repair, and which feature flags provide safer mitigation. Teams ship more confidently when rollback procedures are rehearsed and observable.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Deployments, Rollbacks, and Releases', ARRAY['release promotion', 'feature flags', 'rollback plans', 'deployment safety', 'environment parity']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Monitoring and Incident Response', devops_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Service Level Signals and Alert Design', 'TEXT', 'Monitoring should explain user risk, not just graph infrastructure noise. Define health indicators around latency, error rate, saturation, and queue behavior, then choose alert thresholds that correspond to actionable response rather than vanity visibility.', '', '', module_id),
    ('Incident Review and Operational Learning', 'TEXT', 'The value of incident response comes after the outage. Run reviews that identify system weaknesses, unclear ownership, and gaps in observability or rollout safety. The output should be engineering change, not a document nobody uses.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Monitoring and Incident Response', ARRAY['SLOs', 'alert quality', 'runbooks', 'incident review', 'operational learning']);

    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES (
        'Data Engineering and Analytics Projects',
        'A project-based data course that connects ingestion, modeling, transformation, dashboards, and operational data quality. Students build pipelines that serve actual product and business decisions instead of isolated exercises.',
        admin_id,
        'APPROVED',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO data_course_id;

    INSERT INTO learning_modules (title, course_id) VALUES ('Ingestion and Raw Data Reliability', data_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Designing Ingestion Contracts', 'TEXT', 'Data ingestion starts with contract thinking. Define source cadence, field expectations, null handling, and ownership of broken payloads. Without a clear contract, downstream teams cannot tell whether they are seeing a business anomaly or a pipeline defect.', '', '', module_id),
    ('Raw Zone Validation and Replay Strategy', 'TEXT', 'A reliable raw layer preserves source truth and supports recovery. Store enough metadata to replay loads, inspect bad files, and identify duplicate ingestion. Replay strategy is not optional once product analytics and operational reporting depend on the same feed.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Ingestion and Raw Data Reliability', ARRAY['source contracts', 'schema drift', 'replayability', 'duplicate handling', 'data validation']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Modeling and Transformation Layers', data_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('From Raw Events to Trusted Models', 'TEXT', 'Transformation layers should produce trusted entities and metrics, not just cleaned tables. Define grain, business keys, slowly changing attributes, and naming conventions. A trustworthy model lets analysts and product teams reason about behavior without rediscovering source-system quirks.', '', '', module_id),
    ('Balancing Reuse and Speed in Data Models', 'TEXT', 'A model that supports every possible use case often serves none well. Split reusable base models from purpose-built marts, and make trade-offs explicit: freshness, complexity, performance, and semantic stability. Good modeling is a sequence of deliberate constraints.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Modeling and Transformation Layers', ARRAY['data grain', 'business keys', 'dimensional modeling', 'semantic layers', 'model performance']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Dashboards and Decision Support', data_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Designing Metrics That Drive Action', 'TEXT', 'Dashboards should reduce decision latency. Pick metrics that change behavior, define exactly how each number is calculated, and keep drill-down paths close to the question teams need to answer. A useful dashboard makes the next action clearer, not just the current number.', '', '', module_id),
    ('Narrative Analysis for Product Reviews', 'TEXT', 'Data work is communication work. Organize insights around changes, causes, risk, and next steps. Strong analytics connects a metric movement to user behavior, release context, and recommended action so stakeholders can choose what to do next.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Dashboards and Decision Support', ARRAY['metric design', 'drill-downs', 'trend analysis', 'decision framing', 'stakeholder communication']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Quality, Governance, and Operations', data_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Data Quality Checks that Matter', 'TEXT', 'Quality checks should protect business trust, not just count nulls. Validate record freshness, expected distributions, referential integrity, and metric deltas that signal broken logic. Quality work is strongest when tied to the downstream decisions each dataset supports.', '', '', module_id),
    ('Ownership, Lineage, and Change Safety', 'TEXT', 'Governance works when ownership is visible. Track lineage, define approval paths for metric changes, and document how downstream consumers are informed. The safest analytics organizations treat changes to shared data products with the same care as API changes.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Quality, Governance, and Operations', ARRAY['data quality', 'lineage', 'ownership', 'change management', 'trust signals']);

    INSERT INTO course (title, description, created_by, approval_status, created_at)
    VALUES (
        'Cloud Architecture and System Design Projects',
        'A long-form architecture course centered on project trade-offs. Students design traffic flows, scaling strategies, storage decisions, resilience patterns, and observability across cloud-hosted systems that must survive real usage.',
        admin_id,
        'APPROVED',
        CURRENT_TIMESTAMP
    ) RETURNING id INTO cloud_course_id;

    INSERT INTO learning_modules (title, course_id) VALUES ('Capacity Planning and Traffic Shapes', cloud_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Estimating Demand Before Architecture Choices', 'TEXT', 'Capacity planning starts with user behavior, not instance types. Estimate read and write patterns, peak concentration, burst timing, payload size, and geographic skew before choosing components. The architecture should be a response to demand shape rather than a collection of fashionable services.', '', '', module_id),
    ('Load Distribution and Edge Decisions', 'TEXT', 'Traffic enters through specific chokepoints. Decide where caching helps, where routing should shift, and how edge layers protect origin services. Load balancing is not only about spreading requests but about preserving predictable latency under changing traffic.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Capacity Planning and Traffic Shapes', ARRAY['traffic estimation', 'burst handling', 'edge caching', 'load balancing', 'latency budgets']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Storage, Consistency, and Data Paths', cloud_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Choosing Storage by Access Pattern', 'TEXT', 'Storage choices should follow access pattern, mutation frequency, query complexity, and retention needs. Teams often fail by choosing a tool before defining the path data takes through the system. Start with query needs and operational constraints, then justify the store.', '', '', module_id),
    ('Consistency Trade-offs in Distributed Systems', 'TEXT', 'Consistency is a user experience decision as much as a technical one. Determine which actions require immediate truth, which can tolerate lag, and how stale data is communicated or mitigated. Trade-offs become manageable only when they are visible in the workflow.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Storage, Consistency, and Data Paths', ARRAY['access patterns', 'data partitioning', 'consistency choices', 'retention strategy', 'query paths']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Resilience and Failure Handling', cloud_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Designing for Partial Failure', 'TEXT', 'Distributed systems rarely fail completely. Build for degraded modes, retry boundaries, circuit breakers, and backpressure. Resilience is the ability to continue serving the most valuable workflow when a dependency slows down or returns inconsistent responses.', '', '', module_id),
    ('Recovery Strategies and Safe Degradation', 'TEXT', 'Every critical dependency should have a recovery story. Decide whether the system retries, queues, serves stale data, or blocks the operation, and define how operators understand which mode is active. Safe degradation is intentional behavior, not accidental survival.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Resilience and Failure Handling', ARRAY['partial failure', 'retry boundaries', 'circuit breakers', 'backpressure', 'graceful degradation']);

    INSERT INTO learning_modules (title, course_id) VALUES ('Observability and Evolution', cloud_course_id) RETURNING id INTO module_id;
    INSERT INTO lesson (title, content_type, content, image_url, video_url, module_id) VALUES
    ('Tracing the User Journey Across Services', 'TEXT', 'Observability should let a team answer what happened to a user request, why latency increased, and where failures concentrate. Use logs, traces, and metrics together so technical signals map back to product outcomes and operational urgency.', '', '', module_id),
    ('Evolving the Architecture Safely', 'TEXT', 'Architecture work continues after version one. Review bottlenecks, cost concentration, ownership boundaries, and coupling before splitting or consolidating services. The safest architecture changes are driven by measured pain and clear gains, not abstract purity.', '', '', module_id);
    PERFORM sf_seed_concept_pool(module_id, 'Observability and Evolution', ARRAY['distributed tracing', 'service metrics', 'ownership boundaries', 'cost awareness', 'evolution strategy']);
END $$;

DROP FUNCTION IF EXISTS sf_seed_concept_pool(BIGINT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS sf_seed_question(BIGINT, TEXT, TEXT, TEXT, VARCHAR, TEXT, TEXT[]);
