from sqlalchemy.orm import Session
from app.models import LearningPath, Topic, TopicContent, Question


def seed_if_empty(db: Session):
    if db.query(LearningPath).first():
        return

    paths_data = [
        {"path_key": "dsa", "title": "DSA Mastery", "tagline": "Crack coding rounds",
         "description": "Arrays, Linked Lists, Trees, DP, Graphs",
         "icon": "code", "color": "blue", "order": 1},
        {"path_key": "core", "title": "CS Core", "tagline": "OS, DBMS, CN, OOP",
         "description": "Fundamentals every SDE interview tests",
         "icon": "server", "color": "emerald", "order": 2},
    ]
    for p in paths_data:
        db.add(LearningPath(**p))

    topics_data = [
        {"path_key": "dsa", "topic_key": "arrays", "title": "Arrays",
         "category": "Linear Data Structures", "difficulty": "Easy", "order": 1,
         "estimated_minutes": 90, "icon": "list"},
        {"path_key": "dsa", "topic_key": "linked-lists", "title": "Linked Lists",
         "category": "Linear Data Structures", "difficulty": "Medium", "order": 2,
         "estimated_minutes": 120, "icon": "link"},
        {"path_key": "dsa", "topic_key": "trees", "title": "Trees",
         "category": "Non-Linear", "difficulty": "Hard", "order": 3,
         "estimated_minutes": 180, "icon": "git-branch"},
        {"path_key": "core", "topic_key": "os", "title": "Operating Systems",
         "category": "CS Core", "difficulty": "Medium", "order": 1,
         "estimated_minutes": 150, "icon": "cpu"},
    ]
    for t in topics_data:
        db.add(Topic(**t))
    db.commit()

    arrays_topic = db.query(Topic).filter_by(topic_key="arrays").first()
    if arrays_topic:
        db.add(TopicContent(
            topic_id=arrays_topic.id,
            intro_what="Arrays store elements contiguously in memory, allowing O(1) index access.",
            intro_why="Foundation for most data structures and every coding round starts here.",
            real_world_apps='["Image processing", "Database row storage", "Game grids"]',
            placement_importance="Top companies test array manipulation 60% of coding rounds.",
            learning_objectives='["Understand O(1) indexing", "Master two pointers", "Sliding window"]',
            prerequisites='["Variables", "Loops", "Basic time complexity"]',
            concept_explanation="An array of size N uses N * sizeof(type) bytes contiguous in memory.",
            dry_run_guide="Trace through [3,7,2,9,5] finding maximum step by step.",
            code_examples='{"python": "arr = [1,2,3]; print(arr[1])"}',
            time_space_complexity='{"access": "O(1)", "search": "O(N)", "insert": "O(N)"}'
        ))

        db.add(Question(
            topic_id=arrays_topic.id, question_uid="arrays-mcq-1",
            title="Array index access complexity", difficulty="Easy", type="mcq",
            description="What is the time complexity of accessing arr[i]?",
            options='["O(1)", "O(N)", "O(log N)", "O(N^2)"]',
            correct_answer="O(1)",
            explanation="Direct address = base + i * size, computed in constant time.",
            hints='["Think about memory addresses", "No traversal needed"]',
            tags='["complexity"]', company_tags='["Amazon", "Google"]'
        ))

        db.add(Question(
            topic_id=arrays_topic.id, question_uid="arrays-code-1",
            title="Find Maximum Element", difficulty="Easy", type="easy_coding",
            description="Given a list of integers (space-separated on one line), print the maximum element.",
            starter_code_python="nums = list(map(int, input().split()))\n# Your code here\n",
            starter_code_java="import java.util.*;\npublic class Solution {\n  public static void main(String[] a){\n    Scanner s=new Scanner(System.in);\n    // your code\n  }\n}",
            reference_solution_python="nums = list(map(int, input().split()))\nprint(max(nums))",
            test_cases='[{"input": "3 7 2 9 5\\n", "expected": "9", "hidden": false}, {"input": "-5 -2 -10\\n", "expected": "-2", "hidden": true}]',
            hints='["Initialize with arr[0]", "Iterate and compare", "Return the max"]',
            tags='["array", "traversal"]', company_tags='["Amazon", "TCS"]'
        ))
    db.commit()