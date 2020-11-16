import requests
import re
import csv
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
        table_data = []
        for x in soup.select('tr td'):
            try:
                # Try to extract the IMDb ID
                link = x.findAll('a')[0].get('href')
                imdb_id = re.search(
                    "(?<=title\/)(.*)(?=\/)", link).groups(0)[0]
                table_data.append(imdb_id)
            except Exception:
                pass

            table_data.append(x.text)

        # If data not returned, break out of loop
        if not table_data:
            break

        temp_list = [table_data[i:i+5] for i in range(0, len(table_data), 5)] # put every 5 values in a row

        for temp in temp_list:
            final_list.append(temp)
        i += 200

    return final_list


def find_imdb_id(release):
    '''
    Purpose: Based on a release ID, find the IMDb ID of a given movie.
    Inputs: release (str)
    Returns: an IMDb ID (str)
    '''

    page = 'https://www.boxofficemojo.com/release/' + release
    resp = requests.get(page)
    soup = BeautifulSoup(resp.text, 'lxml')

    for x in soup.findAll('a', href=True):
        try:
            link = x['href']
            imdb_id = re.search("(?<=title\/)(.*)(?=\/)", link).groups(0)[0]
            return imdb_id
        except Exception:
            pass


def get_weekend(max_imdb_count = 5):
    '''
    Purpose: Get historical weekend Domestic Box Office Data from Box Office
             Mojo.
    Inputs: max_imdb_count - the maximum number of observations to include
                             for each week
    Returns: a list of lists
    '''

    final_list = []
    imdb_count = 0
    w = 1
    # for yr in range(1977, 1979):
    for yr in range(1998, 1999):
        for w in range(1, 20):
            key = str(yr) + 'W' + str(w).zfill(2)
            page = 'https://www.boxofficemojo.com/weekend/' + key
            print('Processing: ', page)
            resp = requests.get(page)
            soup = BeautifulSoup(resp.text, 'lxml')
            # https://github.com/eliasdabbas/word_frequency/blob/master/data_scraping/boxoffice.py
            table_data = []
            for x in soup.select('tr td'):
                # Find IMDb ID
                try:
                    # Try to extract the IMDb ID
                    link = x.findAll('a')[0].get('href')
                    release = re.search(
                        "(?<=release\/)(.*)(?=\/)", link).groups(0)[0]
                    imdb_id = find_imdb_id(release)
                    imdb_count += 1
                    table_data.append(imdb_id)
                except Exception:
                    pass

                # Don't include hidden attributes
                if 'hidden' not in x['class']:
                    table_data.append(x.text)

                # Break when you have the top 5 and there is a multiple of 12
                # observations in table_data
                if (imdb_count == max_imdb_count) & (len(table_data) % 12 == 0):
                    break

            if table_data:
                print('Adding page')
                temp_list = []
                temp_list = [table_data[i:i+12] for i in range(0, len(table_data), 12)]

                for temp in temp_list:
                    temp.append(key)
                    final_list.append(temp)

            imdb_count = 0

    return final_list


if __name__ == "__main__":
    box_office = get_lifetime()
    weekend = get_weekend()

    with open('data/lifetime_box_office.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(box_office)

    with open('data/weekly_box_office.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(weekend)
