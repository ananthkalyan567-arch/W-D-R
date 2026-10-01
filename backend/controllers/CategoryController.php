<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - CategoryController
 */

require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../middleware/AdminMiddleware.php';
require_once __DIR__ . '/../helpers/validation.php';
require_once __DIR__ . '/../helpers/response.php';

class CategoryController {
    public function index(): void {
        $type = $_GET['type'] ?? null;
        $activeOnly = !isset($_GET['all']) || $_GET['all'] !== 'true';

        $categories = Category::getAll($type, $activeOnly);
        jsonSuccess("Categories retrieved.", $categories);
    }

    public function create(): void {
        AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $v = Validator::make($input)
            ->required('name', 'type')
            ->in('type', ['water', 'drainage']);

        if ($v->fails()) {
            jsonError($v->firstError(), "VALIDATION_FAILED", 422, $v->errors());
        }

        try {
            $id = Category::create($input);
            $cat = Category::findById($id);
            jsonSuccess("Category created successfully.", $cat, 201);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "CATEGORY_CREATE_ERROR", 500);
        }
    }

    public function update(int $id): void {
        AdminMiddleware::handle();
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            Category::update($id, $input);
            $cat = Category::findById($id);
            jsonSuccess("Category updated successfully.", $cat);
        } catch (Exception $e) {
            jsonError($e->getMessage(), "CATEGORY_UPDATE_ERROR", 400);
        }
    }

    public function delete(int $id): void {
        AdminMiddleware::handle();

        Category::update($id, ['status' => 'inactive']);
        jsonSuccess("Category deactivated successfully.");
    }
}
