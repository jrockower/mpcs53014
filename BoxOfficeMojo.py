import requests
from bs4 import BeautifulSoup

def get_lifetime():
    '''
    Purpose: Get the lifetime gross box office data from Box Office Mojo
    Inputs: None
    Returns: a list of lists
    '''

    final_list = []
    i = 0
    while True:
        page = 'https://www.boxofficemojo.com/chart/top_lifetime_gross/?offset=' + str(i)
        print('Processing: ', page)
        resp = requests.get(page)
        soup = BeautifulSoup(resp.text, 'lxml')
        # https://github.com/eliasdabbas/word_frequency/blob/master/data_scraping/boxoffice.py
        table_data = [x.text for x in soup.select('tr td')]
        # If data not returned, break out of loop
        if not table_data:
            break

        temp_list = [table_data[i:i+4] for i in range(0, len(table_data), 4)] # put every 4 values in a row

        for temp in temp_list:
            final_list.append(temp)
        i += 200

    return final_list


def get_weekend():
    '''
    Purpose: Get historical weekend Domestic Box Office Data from Box Office
             Mojo.
    Inputs: None
    Returns: a list of lists
    '''

    final_list = []
    w = 1
    for yr in range(1977, 1978):
        for w in range(1, 54):
            page = 'https://www.boxofficemojo.com/weekend/' + str(yr) + 'W' + str(w)
            print('Processing: ', page)
            resp = requests.get(page)
            soup = BeautifulSoup(resp.text, 'lxml')
            # https://github.com/eliasdabbas/word_frequency/blob/master/data_scraping/boxoffice.py
            table_data = []
            for x in soup.select('tr td'):
                # Don't include hidden attributes
                if 'hidden' not in x['class']:
                    table_data.append(x.text)

            if table_data:
                print('Adding page')
                # put every 4 values in a row
                temp_list = [table_data[i:i+11] for i in range(0, len(table_data), 11)]
                for temp in temp_list:
                    final_list.append(temp)

    return final_list

if __name__ == "__main__":
    # box_office = get_lifetime()
    weekend = get_weekend()


### ADD IN ID IN BOTH TO GET_LIFETIME
