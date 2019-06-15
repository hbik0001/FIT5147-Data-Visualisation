import pandas as pd

data = pd.read_csv("final_filtered.csv")

data.set_index('CASE_NUMBER', inplace=True)

sample = data[:100]

# data.to_json(r'final_filtered.json', orient='records', lines=True)


data.to_csv(r'sample100.csv')
