<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

class AuthHook
{


    function __construct()
    {
        $this->CI = & get_instance();
    }

    public function check()
    {
        $this->CI->load->library('ion_auth');
        $noSecureClass = $this->getNoSecureClass();
        $class = $this->CI->router->class;
        $action = $this->CI->router->method;
        if ((!in_array($class . '.*', $noSecureClass) && !in_array($class . '.' . $action, $noSecureClass))) {
            if (!$this->CI->ion_auth->logged_in()) {
                redirect('auth/login');
            }
        }
    }

    public function getNoSecureClass()
    {
        return array(
            'auth.*'
        );
    }
}
