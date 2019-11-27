import selenium
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains

class Test:

    def __init__(self, driver):   

        # Figured this out after fair bit of hacking.
        # What you see as 'CodeMirror textarea' is infact the below div
        outer_div = driver.find_element_by_class_name('CodeMirror')

        # At the cursor, there exists a 1px width div which contains 
        # an even smaller textarea. This is where actual text is entered.
        textarea = outer_div.find_element_by_tag_name('div').find_element_by_tag_name('textarea')

        # Implicitly wait until codemirror loads; dynamic content
        driver.implicitly_wait(10)
        # Focus on codemirror
        ActionChains(driver).move_to_element(textarea).click(textarea).perform()

        # All input to be sent to editor object
        self.editor = textarea

    def send_key(self, key):
        """
        Send letters as 'a'.
        Send special keys as 'Keys.ENTER'
        """
        self.editor.send_keys(key)

if __name__ == '__main__':
    driver = webdriver.Chrome()
    driver.get("http://localhost:4000/editor")
    test = Test(driver)
    
    test.send_key('a')
    test.send_key('b')
    test.send_key('c')
    test.send_key(Keys.ENTER)
    test.send_key('d')
    test.send_key('e')
    test.send_key('f')
    test.send_key(Keys.BACK_SPACE)
    test.send_key(Keys.BACK_SPACE)
