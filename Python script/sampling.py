import pandas as pd
import numpy as np

df = pd.read_csv("final_filtered_H1B.csv")

states_group = df.groupby('WORKSITE_STATE').apply(lambda x: x)

case_status_group = states_group.groupby('CASE_STATUS').apply(lambda x: x)

final_sample = case_status_group.sample(frac=0.1, weights='PREVAILING_WAGE', random_state=1)

final_sample.to_csv(r'Sampling01.csv')
