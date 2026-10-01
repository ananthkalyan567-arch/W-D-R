<?php
declare(strict_types=1);

/**
 * ASR Water & Drainage - Central API Router
 * Dispatches HTTP requests to designated controller actions with parameter extraction.
 */

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ComplaintController.php';
require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../controllers/LocationController.php';
require_once __DIR__ . '/../controllers/CategoryController.php';
require_once __DIR__ . '/../controllers/OrganizationController.php';
require_once __DIR__ . '/../controllers/AnalyticsController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/NotificationController.php';
require_once __DIR__ . '/../controllers/ReportController.php';
require_once __DIR__ . '/../controllers/RainwaterController.php';
require_once __DIR__ . '/../controllers/AIController.php';
require_once __DIR__ . '/../middleware/RateLimitMiddleware.php';
require_once __DIR__ . '/../middleware/CsrfMiddleware.php';
require_once __DIR__ . '/../helpers/response.php';

class Router {
    private array $routes = [];

    public function add(string $method, string $path, string $handler): void {
        $this->routes[] = [
            'method'  => strtoupper($method),
            'pattern' => $this->convertPathToRegex($path),
            'handler' => $handler
        ];
    }

    private function convertPathToRegex(string $path): string {
        // Convert {id} to named regex capture group
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[0-9]+)', $path);
        return '#^' . $pattern . '$#';
    }

    public function dispatch(string $method, string $uri): void {
        // Strip query parameters
        $cleanUri = parse_url($uri, PHP_URL_PATH);
        $method = strtoupper($method);

        // Global Rate Limiting (120 req/min)
        RateLimitMiddleware::handle();

        // Global CSRF Validation for form posts
        CsrfMiddleware::handle();

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $cleanUri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                [$controllerName, $action] = explode('@', $route['handler']);

                if (!class_exists($controllerName)) {
                    jsonError("Controller {$controllerName} not found.", "ROUTER_ERROR", 500);
                }

                $controller = new $controllerName();
                if (!method_exists($controller, $action)) {
                    jsonError("Action {$action} not found on {$controllerName}.", "ROUTER_ERROR", 500);
                }

                // Call action with extracted URL parameters
                call_user_func_array([$controller, $action], $params);
                return;
            }
        }

        // Endpoint not found
        jsonError("API endpoint not found: {$method} {$cleanUri}", "ENDPOINT_NOT_FOUND", 404);
    }
}

// Build Router Instance
$router = new Router();

// ------------------------------------------------------------------------------
// 1. AUTHENTICATION ROUTES
// ------------------------------------------------------------------------------
$router->add('POST', '/api/v1/auth/register', 'AuthController@register');
$router->add('POST', '/api/v1/auth/login', 'AuthController@login');
$router->add('POST', '/api/v1/auth/logout', 'AuthController@logout');
$router->add('GET',  '/api/v1/auth/me', 'AuthController@me');
$router->add('POST', '/api/v1/auth/forgot-password', 'AuthController@forgotPassword');
$router->add('POST', '/api/v1/auth/reset-password', 'AuthController@resetPassword');

// ------------------------------------------------------------------------------
// 2. CITIZEN & PUBLIC COMPLAINT ROUTES
// ------------------------------------------------------------------------------
$router->add('POST', '/api/v1/complaints', 'ComplaintController@create');
$router->add('GET',  '/api/v1/complaints', 'ComplaintController@index');
$router->add('GET',  '/api/v1/complaints/track', 'ComplaintController@track');
$router->add('GET',  '/api/v1/complaints/{id}', 'ComplaintController@show');
$router->add('GET',  '/api/v1/complaints/{id}/timeline', 'ComplaintController@timeline');
$router->add('POST', '/api/v1/complaints/{id}/updates', 'ComplaintController@addUpdate');

// Map Route
$router->add('GET',  '/api/v1/map/complaints', 'ComplaintController@map');

// ------------------------------------------------------------------------------
// 3. ADMIN COMPLAINT MANAGEMENT ROUTES
// ------------------------------------------------------------------------------
$router->add('GET',   '/api/v1/admin/dashboard', 'AdminController@dashboard');
$router->add('GET',   '/api/v1/admin/complaints', 'AdminController@complaints');
$router->add('GET',   '/api/v1/admin/complaints/{id}', 'AdminController@complaint');
$router->add('POST',  '/api/v1/admin/complaints/{id}/assign', 'AdminController@assign');
$router->add('POST',  '/api/v1/admin/complaints/{id}/status', 'AdminController@updateStatus');
$router->add('POST',  '/api/v1/admin/complaints/{id}/resolve', 'AdminController@resolve');
$router->add('POST',  '/api/v1/admin/complaints/{id}/reject', 'AdminController@reject');
$router->add('POST',  '/api/v1/admin/complaints/{id}/duplicate', 'AdminController@duplicate');
$router->add('GET',   '/api/v1/admin/audit-logs', 'AdminController@auditLogs');

// ------------------------------------------------------------------------------
// 4. LOCATIONS HIERARCHY ROUTES
// ------------------------------------------------------------------------------
$router->add('GET',    '/api/v1/locations', 'LocationController@index');
$router->add('GET',    '/api/v1/locations/{id}', 'LocationController@show');
$router->add('POST',   '/api/v1/admin/locations', 'LocationController@create');
$router->add('PATCH',  '/api/v1/admin/locations/{id}', 'LocationController@update');
$router->add('DELETE', '/api/v1/admin/locations/{id}', 'LocationController@delete');

// ------------------------------------------------------------------------------
// 5. PROBLEM CATEGORY ROUTES
// ------------------------------------------------------------------------------
$router->add('GET',    '/api/v1/categories', 'CategoryController@index');
$router->add('POST',   '/api/v1/admin/categories', 'CategoryController@create');
$router->add('PATCH',  '/api/v1/admin/categories/{id}', 'CategoryController@update');
$router->add('DELETE', '/api/v1/admin/categories/{id}', 'CategoryController@delete');

// ------------------------------------------------------------------------------
// 6. ORGANIZATION & DEPARTMENT ROUTES
// ------------------------------------------------------------------------------
$router->add('GET',   '/api/v1/organizations', 'OrganizationController@index');
$router->add('POST',  '/api/v1/admin/organizations', 'OrganizationController@create');
$router->add('GET',   '/api/v1/admin/organizations/{id}', 'OrganizationController@show');
$router->add('PATCH', '/api/v1/admin/organizations/{id}', 'OrganizationController@update');
$router->add('POST',  '/api/v1/admin/organizations/{id}/users', 'OrganizationController@addUser');
$router->add('GET',   '/api/v1/organization/complaints', 'OrganizationController@myComplaints');

// ------------------------------------------------------------------------------
// 7. USER MANAGEMENT ROUTES
// ------------------------------------------------------------------------------
$router->add('GET',   '/api/v1/admin/users', 'UserController@index');
$router->add('GET',   '/api/v1/admin/users/{id}', 'UserController@show');
$router->add('PATCH', '/api/v1/admin/users/{id}', 'UserController@update');
$router->add('POST',  '/api/v1/admin/users/{id}/suspend', 'UserController@suspend');
$router->add('POST',  '/api/v1/admin/users/{id}/activate', 'UserController@activate');

// ------------------------------------------------------------------------------
// 8. ANALYTICS & INTELLIGENCE ROUTES
// ------------------------------------------------------------------------------
$router->add('GET', '/api/v1/admin/analytics', 'AnalyticsController@index');
$router->add('GET', '/api/v1/admin/analytics/trends', 'AnalyticsController@trends');
$router->add('GET', '/api/v1/admin/analytics/categories', 'AnalyticsController@categories');
$router->add('GET', '/api/v1/admin/analytics/locations', 'AnalyticsController@locations');
$router->add('GET', '/api/v1/admin/analytics/status', 'AnalyticsController@status');
$router->add('GET', '/api/v1/admin/analytics/resolution-time', 'AnalyticsController@resolutionTime');

// ------------------------------------------------------------------------------
// 9. NOTIFICATIONS & REPORTS
// ------------------------------------------------------------------------------
$router->add('GET',  '/api/v1/notifications', 'NotificationController@index');
$router->add('POST', '/api/v1/notifications/{id}/read', 'NotificationController@markRead');
$router->add('GET',  '/api/v1/admin/reports/csv', 'ReportController@exportCsv');

// ------------------------------------------------------------------------------
// 10. RAINWATER MANAGEMENT & DRIP OPENING MODULE ROUTES
// ------------------------------------------------------------------------------
$router->add('GET',   '/api/v1/rainwater', 'RainwaterController@index');
$router->add('POST',  '/api/v1/rainwater', 'RainwaterController@create');
$router->add('GET',   '/api/v1/my/rainwater', 'RainwaterController@myReports');
$router->add('GET',   '/api/v1/rainwater/{id}', 'RainwaterController@show');
$router->add('GET',   '/api/v1/map/rainwater', 'RainwaterController@map');

// Admin Rainwater Endpoints
$router->add('GET',   '/api/v1/admin/rainwater', 'RainwaterController@adminIndex');
$router->add('GET',   '/api/v1/admin/rainwater/{id}', 'RainwaterController@adminShow');
$router->add('PATCH', '/api/v1/admin/rainwater/{id}/verify', 'RainwaterController@verify');
$router->add('PATCH', '/api/v1/admin/rainwater/{id}/status', 'RainwaterController@updateStatus');
$router->add('POST',  '/api/v1/admin/rainwater/{id}/assign', 'RainwaterController@assign');
// ------------------------------------------------------------------------------
// 11. AI ASSISTANT ROUTES ("ASR Water Assistant" / "Jala Mitra")
// ------------------------------------------------------------------------------
$router->add('POST', '/api/v1/ai/chat', 'AIController@chat');
$router->add('POST', '/api/v1/ai/feedback', 'AIController@feedback');
$router->add('GET',  '/api/v1/admin/ai/analytics', 'AIController@analytics');
$router->add('GET',  '/api/v1/admin/ai/settings', 'AIController@getSettings');

return $router;
