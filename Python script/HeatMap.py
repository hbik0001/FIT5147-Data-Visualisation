import pandas as pd
import numpy as np

data = pd.read_csv("final_filtered.csv")
data.set_index('CASE_NUMBER', inplace=True)
year = ['2013', '2014', '2015', '2016']
unit_pay = 'Year'
state_id = ['AL','AK','AS','AZ','AR','CA','CO','CT','DE','DC','FM','FL','GA','GU','HI','ID','IL','IN','IA','KS','KY','LA','ME','MH','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','MP','OH','OK','OR','PW','PA','PR','RI','SC','SD','TN','TX','UT','VT','VI','VA','WA','WV','WI','WY']
state_name = ['Alabama','Alaska','American Samoa',	'Arizona','Arkansas','California',	'Colorado',	'Connecticut','Delaware','District Of Columbia',	'Federated States Of Micronesia',	'Florida',	'Georgia',	'Guam',	'Hawaii',	'Idaho',	'Illinois',	'Indiana',	'Iowa',	'Kansas',	'Kentucky',	'Louisiana',	'Maine',	'Marshall Islands',	'Maryland',	'Massachusetts',	'Michigan',	'Minnesota',	'Mississippi',	'Missouri',	'Montana',	'Nebraska',	'Nevada',	'New Hampshire',	'New Jersey',	'New Mexico',	'New York',	'North Carolina',	'North Dakota',	'Northern Mariana Islands',	'Ohio',	'Oklahoma',	'Oregon',	'Palau',	'Pennsylvania',	'Puerto Rico',	'Rhode Island',	'South Carolina',	'South Dakota',	'Tennessee' ,'Texas',	'Utah',	'Vermont',	'Virgin Islands',	'Virginia',	'Washington',	'West Virginia',	'Wisconsin',	'Wyoming']

state_dict = dict(zip(state_id, state_name))
# df = pd.DataFrame(columns=['State', '2013', '2014', '2015', '2016'])
# df['State'] = np.array(state_name)
#
# print(df)

filters = data['PW_UNIT_OF_PAY'] == 'Year'
value = data[filters].groupby(['PW_SOURCE_YEAR', 'WORKSITE_STATE'])["PREVAILING_WAGE"].apply(lambda x : ((x.astype(int).sum())/len(x))/10000)

calc_value = value.to_frame()

calc_value.to_csv(r'HeatMap100.csv')

Heat_value = pd.read_csv("HeatMap100.csv")


def replace_states(row):

    for item in state_dict.items():
        if item[0] == row:
            return item[1]

# def map_key_value(row):
#
#     if row['PW_SOURCE_YEAR']


Heat_value["WORKSITE_STATE"] = Heat_value["WORKSITE_STATE"].apply(replace_states)

Heat_value["2013"] = np.nan
Heat_value["2014"] = np.nan
Heat_value["2015"] = np.nan
Heat_value["2016"] = np.nan

Heat_value.to_csv(r'HeatMap.csv')


#Heat_value = Heat_value.apply(map_key_value)


#print(Heat_value)


